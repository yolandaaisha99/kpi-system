import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './loginmobile.module.css'

export default function LoginMobile() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate              = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await api.post('/auth/login', form)
      const { token, user } = res.data

      // Hanya karyawan yang bisa login di mobile
      if (user.role !== 'employee') {
        setError('Akses ditolak. Halaman ini hanya untuk Karyawan. Gunakan aplikasi web untuk Manajer.')
        return
      }

      localStorage.setItem('kpi_token', token)
      localStorage.setItem('kpi_user', JSON.stringify(user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Username atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topDecor} />

      <div className={styles.header}>
        <div className={styles.logoIcon}>📊</div>
        <h1 className={styles.appName}>KPI Tracker</h1>
        <p className={styles.appSub}>Pantau & update progres kerjamu</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Masuk</h2>
        <p className={styles.desc}>Login sebagai Karyawan</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label className={styles.label}>Username</label>
            <input
              type="text" name="username"
              className={styles.input}
              placeholder="andi_karyawan"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Password</label>
            <input
              type="password" name="password"
              className={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk →'}
          </button>
        </form>

        <p className={styles.hint}>
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
          <br /><br />
          Manajer? Buka <strong>kpi-frontend.run.app</strong>
        </p>
      </div>
    </div>
  )
}
