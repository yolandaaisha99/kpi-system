// src/pages/KpiWeights.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import styles from './Dashboard.module.css'

export default function KpiWeights() {
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/kpi-weights')
      .then(r => setWeights(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}><div className={styles.spinner}/>Memuat...</div>

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Input Bobot KPI</h1>
          <p className={styles.pageDesc}>Kelola bobot dan target KPI per karyawan</p>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Indikator KPI</th>
                <th>Bobot</th>
                <th>Target</th>
                <th>Satuan</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {weights.length === 0 ? (
                <tr><td colSpan={6} className={styles.emptyRow}>Belum ada bobot KPI. Tambahkan dari Dashboard.</td></tr>
              ) : weights.map(w => (
                <tr key={w.id}>
                  <td className={styles.empName}>{w.employee?.name}</td>
                  <td className={styles.kpiName}>{w.category?.name}</td>
                  <td><span className={styles.weightPill}>{w.weight}%</span></td>
                  <td style={{fontFamily:'var(--font-mono)', color:'var(--text-2)'}}>{w.target_value}</td>
                  <td style={{color:'var(--text-3)', fontSize:'12px'}}>{w.category?.unit}</td>
                  <td style={{color:'var(--text-3)', fontSize:'12px'}}>{w.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}