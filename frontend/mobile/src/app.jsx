import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import UpdateProgress from './pages/UpdateProgress.jsx'
import LoginMobile from './pages/LoginMobile.jsx'
import Notifications from './pages/Notifications.jsx'

function Guard({ children }) {
  const token = localStorage.getItem('kpi_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginMobile />} />
        <Route path="/" element={<Guard><Home /></Guard>} />
        <Route path="/update" element={<Guard><UpdateProgress /></Guard>} />
        <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}