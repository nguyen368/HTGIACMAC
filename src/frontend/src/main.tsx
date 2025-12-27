import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* BrowserRouter là bắt buộc để tính năng chuyển trang hoạt động */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)