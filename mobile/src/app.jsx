import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/home.jsx'
import UpdateProgress from './pages/updateprogress.jsx'
import LoginMobile from './pages/loginmobile.jsx'
import RegisterMobile from './pages/registermobile.jsx'
import Notifications from './pages/notifications.jsx'

function Guard({ children }) {
  const token = localStorage.getItem('kpi_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginMobile />} />
        <Route path="/register" element={<RegisterMobile />} />
        <Route path="/" element={<Guard><Home /></Guard>} />
        <Route path="/update" element={<Guard><UpdateProgress /></Guard>} />
        <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}