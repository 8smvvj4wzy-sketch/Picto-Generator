import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { enregistrerServiceWorker } from './pwa.js'
import './styles/app.css'
import './impression/impression.css'

createRoot(document.getElementById('racine')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

enregistrerServiceWorker()
