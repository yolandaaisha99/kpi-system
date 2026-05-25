// src/pages/Employees.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import styles from './Dashboard.module.css'

export function Employees() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/employees')
      .then(r => setList(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}><div className={styles.spinner}/>Memuat...</div>

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Data Karyawan</h1>
          <p className={styles.pageDesc}>Daftar karyawan yang terdaftar di sistem</p>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Nama</th><th>Email</th><th>Departemen</th><th>Posisi</th><th>Status</th></tr>
            </thead>
            <tbody>
              {list.length === 0
                ? <tr><td colSpan={5} className={styles.emptyRow}>Belum ada data karyawan.</td></tr>
                : list.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className={styles.empCell}>
                        <div className={styles.empAvatar} style={{background:'var(--accent-dim)', color:'var(--accent)'}}>
                          {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div className={styles.empName}>{emp.name}</div>
                      </div>
                    </td>
                    <td style={{color:'var(--text-2)', fontSize:'12px'}}>{emp.email}</td>
                    <td style={{color:'var(--text-2)'}}>{emp.department}</td>
                    <td style={{color:'var(--text-2)'}}>{emp.position}</td>
                    <td>
                      <span className={emp.is_active ? styles.chipGreen : styles.chipDanger} style={{display:'inline-block',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px'}}>
                        {emp.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// src/pages/Evaluations.jsx
export function Evaluations() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/evaluations')
      .then(r => setList(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    if (!confirm('Generate evaluasi untuk semua karyawan periode ini?')) return
    try {
      const res = await api.post('/evaluations/generate', { period_id: 1 })
      alert(res.data.message)
      window.location.reload()
    } catch (err) {
      alert('Gagal generate evaluasi.')
    }
  }

  async function handleApprove(id) {
    try {
      await api.post(`/evaluations/${id}/approve`)
      setList(l => l.map(e => e.id === id ? { ...e, status: 'approved' } : e))
    } catch { alert('Gagal approve.') }
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner}/>Memuat...</div>

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Penilaian Karyawan</h1>
          <p className={styles.pageDesc}>Hasil evaluasi KPI periode aktif</p>
        </div>
        <div className={styles.topbarRight}>
          <button className={styles.btnPrimary} onClick={handleGenerate}>⚡ Generate Evaluasi</button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Karyawan</th><th>Skor</th><th>Grade</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {list.length === 0
                ? <tr><td colSpan={5} className={styles.emptyRow}>Belum ada evaluasi. Klik "Generate Evaluasi" untuk menghitung skor.</td></tr>
                : list.map(ev => (
                  <tr key={ev.id}>
                    <td className={styles.empName}>{ev.employee?.name}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontWeight:700, color: ev.total_score >= 75 ? 'var(--accent)' : ev.total_score >= 50 ? 'var(--warn)' : 'var(--danger)'}}>
                      {ev.total_score}
                    </td>
                    <td><span style={{fontFamily:'var(--font-mono)', fontWeight:800, color:'var(--accent-2)'}}>{ev.grade}</span></td>
                    <td>
                      <span style={{display:'inline-block',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px', background: ev.status==='approved' ? 'var(--accent-dim)' : 'var(--warn-dim)', color: ev.status==='approved' ? 'var(--accent)' : 'var(--warn)'}}>
                        {ev.status === 'approved' ? 'Disetujui' : ev.status === 'submitted' ? 'Menunggu' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      {ev.status !== 'approved' && (
                        <button className={styles.actionBtn} onClick={() => handleApprove(ev.id)}>Approve</button>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// src/pages/Reports.jsx
export function Reports() {
  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Laporan Manajer</h1>
          <p className={styles.pageDesc}>Ringkasan evaluasi bulanan</p>
        </div>
        <button className={styles.btnPrimary}>+ Buat Laporan</button>
      </div>
      <div className={styles.content}>
        <div style={{textAlign:'center', color:'var(--text-3)', padding:'60px 0', fontSize:'14px'}}>
          Laporan akan muncul setelah evaluasi di-approve. <br/>
          Pergi ke halaman Penilaian untuk approve evaluasi terlebih dahulu.
        </div>
      </div>
    </div>
  )
}

export default Employees