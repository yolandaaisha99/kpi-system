// src/pages/Evaluations.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import styles from './Dashboard.module.css'

export default function Evaluations() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/evaluations')
      .then(r => setList(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    if (!window.confirm('Generate evaluasi untuk semua karyawan periode ini?')) return
    try {
      const res = await api.post('/evaluations/generate', { period_id: 1 })
      alert(res.data.message)
      const r = await api.get('/evaluations')
      setList(r.data.data || [])
    } catch { alert('Gagal generate evaluasi.') }
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
                ? <tr><td colSpan={5} className={styles.emptyRow}>Belum ada evaluasi. Klik "Generate Evaluasi".</td></tr>
                : list.map(ev => (
                  <tr key={ev.id}>
                    <td className={styles.empName}>{ev.employee?.name}</td>
                    <td style={{fontFamily:'var(--font-mono)',fontWeight:700,color:ev.total_score>=75?'var(--accent)':ev.total_score>=50?'var(--warn)':'var(--danger)'}}>
                      {ev.total_score}
                    </td>
                    <td style={{fontFamily:'var(--font-mono)',fontWeight:800,color:'var(--accent-2)'}}>{ev.grade}</td>
                    <td>
                      <span style={{display:'inline-block',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px',
                        background:ev.status==='approved'?'var(--accent-dim)':'var(--warn-dim)',
                        color:ev.status==='approved'?'var(--accent)':'var(--warn)'}}>
                        {ev.status==='approved'?'Disetujui':ev.status==='submitted'?'Menunggu':'Draft'}
                      </span>
                    </td>
                    <td>
                      {ev.status!=='approved'&&<button className={styles.actionBtn} onClick={()=>handleApprove(ev.id)}>Approve</button>}
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