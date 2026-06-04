import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout.jsx'
import Dashboard from './pages/dashboard.jsx'
import KpiWeights from './pages/kpiweight.jsx'
import Employees from './pages/employees.jsx'
import Evaluations from './pages/evaluation.jsx'
import Reports from './pages/report.jsx'
import Login from './pages/login.jsx'
import Register from './pages/register.jsx'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('kpi_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="kpi-weights" element={<KpiWeights />} />
          <Route path="employees" element={<Employees />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}