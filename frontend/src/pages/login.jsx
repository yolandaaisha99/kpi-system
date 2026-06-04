import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './login.module.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { token, user } = res.data

      // Validasi: hanya manajer yang bisa login di web
      if (user.role !== 'manager') {
        setError('Akses ditolak. Halaman ini hanya untuk Manajer. Gunakan aplikasi mobile untuk karyawan.')
        return
      }

      localStorage.setItem('kpi_token', token)
      localStorage.setItem('kpi_user', JSON.stringify(user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>📊</div>
          <div>
            <div className={styles.logoText}>KPI Manager</div>
            <div className={styles.logoSub}>Sistem Penilaian Kinerja Karyawan</div>
          </div>
        </div>

        <h1 className={styles.title}>Selamat Datang</h1>
        <p className={styles.desc}>Masuk sebagai Manajer untuk mengelola evaluasi KPI</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              className={styles.input}
              placeholder="manager@kpi.app"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formRow}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              className={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk ke Dashboard →'}
          </button>
        </form>

        <p className={styles.hint}>
          Karyawan? Gunakan <strong>aplikasi mobile KPI Tracker</strong>
        </p>
      </div>
    </div>
  )
}