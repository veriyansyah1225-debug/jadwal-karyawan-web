CREATE OR REPLACE FUNCTION public.save_employee_monthly_schedule(
  p_employee_id bigint,
  p_month_start date,
  p_month_end date,
  p_rows jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_month_start date;
  v_month_end date;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = v_uid AND au.role = 'admin' AND au.aktif = true
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: admin aktif diperlukan.' USING ERRCODE = '42501';
  END IF;

  IF p_employee_id IS NULL OR p_month_start IS NULL OR p_month_end IS NULL
     OR p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Parameter jadwal bulanan tidak valid.' USING ERRCODE = '22023';
  END IF;

  v_month_start := date_trunc('month', p_month_start)::date;
  v_month_end := (date_trunc('month', p_month_start) + interval '1 month - 1 day')::date;
  IF p_month_start <> v_month_start OR p_month_end <> v_month_end THEN
    RAISE EXCEPTION 'Rentang tanggal harus mencakup satu bulan kalender penuh.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id = p_employee_id) THEN
    RAISE EXCEPTION 'Karyawan tidak ditemukan.' USING ERRCODE = '22023';
  END IF;

  -- Serialize monthly schedule changes for this employee.
  PERFORM 1 FROM public.employees e WHERE e.id = p_employee_id FOR UPDATE;

  -- Validate all payload rows before any deletion.
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_rows) AS x(date date, "codeId" bigint)
    WHERE x.date IS NULL OR x.date < p_month_start OR x.date > p_month_end OR x."codeId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Ada tanggal atau kode jadwal tidak valid.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT x.date FROM jsonb_to_recordset(p_rows) AS x(date date, "codeId" bigint)
    GROUP BY x.date HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Satu tanggal tidak boleh memiliki lebih dari satu kode jadwal.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_rows) AS x(date date, "codeId" bigint)
    LEFT JOIN public.schedule_codes sc ON sc.id = x."codeId"
    WHERE sc.id IS NULL OR sc.aktif IS DISTINCT FROM true
  ) THEN
    RAISE EXCEPTION 'Kode jadwal tidak ditemukan atau tidak aktif.' USING ERRCODE = '22023';
  END IF;

  -- Never silently replace a job assignment with a schedule code.
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_rows) AS x(date date, "codeId" bigint)
    JOIN public.employee_schedules es
      ON es.employee_id = p_employee_id AND es.tanggal = x.date AND es.job_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Ada tanggal yang sudah memiliki penugasan pekerjaan. Selesaikan konflik tersebut terlebih dahulu.'
      USING ERRCODE = '23505';
  END IF;

  DELETE FROM public.employee_schedules es
  WHERE es.employee_id = p_employee_id
    AND es.tanggal BETWEEN p_month_start AND p_month_end
    AND es.schedule_code_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_to_recordset(p_rows) AS x(date date, "codeId" bigint)
      WHERE x.date = es.tanggal
    );

  INSERT INTO public.employee_schedules (employee_id, tanggal, schedule_code_id, keterangan)
  SELECT p_employee_id, x.date, x."codeId", es.keterangan
  FROM jsonb_to_recordset(p_rows) AS x(date date, "codeId" bigint)
  LEFT JOIN public.employee_schedules es
    ON es.employee_id = p_employee_id AND es.tanggal = x.date AND es.schedule_code_id IS NOT NULL
  ON CONFLICT (employee_id, tanggal)
  DO UPDATE SET
    schedule_code_id = EXCLUDED.schedule_code_id,
    keterangan = COALESCE(public.employee_schedules.keterangan, EXCLUDED.keterangan);
END;
$function$;

REVOKE ALL ON FUNCTION public.save_employee_monthly_schedule(bigint, date, date, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_employee_monthly_schedule(bigint, date, date, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_employee_monthly_schedule(bigint, date, date, jsonb) TO authenticated;
