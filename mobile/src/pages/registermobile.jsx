import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './loginmobile.module.css'

export default function RegisterMobile() {
  const [form, setForm]       = useState({ name: '', username: '', password: '' })
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
      const res  = await api.post('/auth/register', form)
      const { token, user } = res.data

      localStorage.setItem('kpi_token', token)
      localStorage.setItem('kpi_user', JSON.stringify(user))
      
      alert('Registrasi berhasil! Anda sekarang masuk sebagai Karyawan.')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan registrasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topDecor} />

      <div className={styles.header}>
        <div className={styles.logoIcon}>📝</div>
        <h1 className={styles.appName}>KPI Tracker</h1>
        <p className={styles.appSub}>Daftar akun Karyawan baru</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Registrasi</h2>
        <p className={styles.desc}>Buat akun Anda</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label className={styles.label}>Nama Lengkap</label>
            <input
              type="text" name="name"
              className={styles.input}
              placeholder="Budi Santoso"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Username</label>
            <input
              type="text" name="username"
              className={styles.input}
              placeholder="budi_karyawan"
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
              minLength={6}
            />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Mendaftar...' : 'Daftar Sekarang →'}
          </button>
        </form>

        <p className={styles.hint}>
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
