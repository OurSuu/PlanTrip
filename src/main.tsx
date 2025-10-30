import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext' // <--- 1. Import ToastProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider> {/* <--- 2. วาง ToastProvider ที่นี่ */}
          <App />
        </ToastProvider> {/* <--- 2. สิ้นสุด ToastProvider */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
