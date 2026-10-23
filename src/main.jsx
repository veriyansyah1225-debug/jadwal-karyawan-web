import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import VisitHistory from './VisitHistory'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <VisitHistory />
  </React.StrictMode>,
)
