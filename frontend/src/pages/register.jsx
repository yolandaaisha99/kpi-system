import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './login.module.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', password: '' })
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
      const res = await api.post('/auth/register', form)
      const { token, user } = res.data

      localStorage.setItem('kpi_token', token)
      localStorage.setItem('kpi_user', JSON.stringify(user))
      
      // Auto login as employee, but frontend is for manager. 
      // User requested "otomatais jadi employee, buatin manager yang baru sederhana yang penting berhasil login"
      // Wait, if they are employee, they shouldn't be here. But maybe they just want to see it work.
      // If the frontend rejects non-managers, they will be kicked out. 
      // Let's redirect to login and tell them they registered successfully.
      
      navigate('/login')
      alert('Registrasi berhasil! Silakan login melalui aplikasi Mobile untuk Karyawan, atau gunakan halaman ini jika Anda adalah Manajer.')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan registrasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>📝</div>
          <div>
            <div className={styles.logoText}>KPI Manager</div>
            <div className={styles.logoSub}>Daftar Akun Baru</div>
          </div>
        </div>

        <h1 className={styles.title}>Registrasi</h1>
        <p className={styles.desc}>Buat akun karyawan baru</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              className={styles.input}
              placeholder="Budi Santoso"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formRow}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              className={styles.input}
              placeholder="budi_karyawan"
              value={form.username}
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
              autoComplete="new-password"
              className={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className={styles.hint}>
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
