import { useState, useEffect } from 'react'
import api from '../utils/api.js'
import styles from './Dashboard.module.css'

// ── Sub-komponen MetricCard ──────────────────
function MetricCard({ label, value, sub, color }) {
  return (
    <div className={`${styles.metricCard} ${styles[color]}`}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={`${styles.metricValue} ${styles[color]}`}>{value}</div>
      <div className={styles.metricSub}>{sub}</div>
    </div>
  )
}

// ── Sub-komponen ProgressBar ─────────────────
function ProgressBar({ pct }) {
  const color = pct >= 75 ? 'green' : pct >= 50 ? 'warn' : 'danger'
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${styles[color]}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`${styles.progressPct} ${styles[color]}`}>{pct}%</span>
    </div>
  )
}

// ── Sub-komponen StatusChip ──────────────────
function StatusChip({ label, color }) {
  return <span className={`${styles.chip} ${styles[`chip${color}`]}`}>{label}</span>
}

// ── Modal Input Bobot KPI ────────────────────
function KpiModal({ onClose, onSaved, employees, categories }) {
  const [form, setForm] = useState({
    period_id: 1, employee_id: '', category_id: '',
    weight: '', target_value: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.employee_id || !form.category_id || !form.weight || !form.target_value) {
      setError('Semua field wajib diisi!')
      return
    }
    setLoading(true)
    try {
      await api.post('/kpi-weights', form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Input Bobot KPI</h2>
            <p className={styles.modalSub}>Tetapkan target dan bobot KPI untuk karyawan</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Karyawan</label>
            <select name="employee_id" className={styles.formSelect} value={form.employee_id} onChange={handleChange}>
              <option value="">Pilih karyawan...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.position}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Indikator KPI</label>
            <select name="category_id" className={styles.formSelect} value={form.category_id} onChange={handleChange}>
              <option value="">Pilih indikator...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.unit})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow2}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Bobot (%)</label>
              <input
                type="number" name="weight" min="1" max="100"
                placeholder="cth: 40"
                className={styles.formInput}
                value={form.weight} onChange={handleChange}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Nilai Target</label>
              <input
                type="number" name="target_value" min="1"
                placeholder="cth: 100"
                className={styles.formInput}
                value={form.target_value} onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Catatan (opsional)</label>
            <input
              type="text" name="notes"
              placeholder="Catatan untuk karyawan..."
              className={styles.formInput}
              value={form.notes} onChange={handleChange}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Halaman Dashboard Utama ──────────────────
export default function Dashboard() {
  const [data, setData] = useState(null)
  const [employees, setEmployees] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [dashRes, empRes, catRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/employees'),
        api.get('/kpi-categories'),
      ])
      setData(dashRes.data.data)
      setEmployees(empRes.data.data)
      setCategories(catRes.data.data)
    } catch (err) {
      console.error('Gagal load data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter tabel
  const filtered = (data?.employees || []).filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase())
    const matchDept   = deptFilter ? emp.department === deptFilter : true
    return matchSearch && matchDept
  })

  function getChipColor(score) {
    if (score >= 75) return 'Green'
    if (score >= 50) return 'Warn'
    return 'Danger'
  }

  function getStatusLabel(score) {
    if (score >= 75) return 'Baik'
    if (score >= 50) return 'Perlu Tinjauan'
    return 'Di Bawah Target'
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} />Memuat data...</div>

  return (
    <div className={styles.page}>
      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Evaluasi</h1>
          <p className={styles.pageDesc}>Periode aktif: {data?.period?.name || 'Mei 2026'}</p>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.periodBadge}>{data?.period?.name || 'Mei 2026'}</span>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
            + Input Bobot KPI
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* ── METRIC CARDS ── */}
        <div className={styles.metricsGrid}>
          <MetricCard label="Total Karyawan" value={data?.metrics?.total_employees || 0} sub="Aktif periode ini" color="blue" />
          <MetricCard label="Rata-rata KPI"  value={`${data?.metrics?.avg_score || 0}%`} sub={`↑ +${data?.metrics?.score_change || 0}% vs bulan lalu`} color="green" />
          <MetricCard label="Di Bawah Target" value={data?.metrics?.below_target || 0} sub="Perlu perhatian" color="warn" />
          <MetricCard label="Belum Update"  value={data?.metrics?.not_updated || 0} sub="Lebih dari 3 hari" color="danger" />
        </div>

        {/* ── TABLE ── */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Penilaian Karyawan — Bobot KPI</h2>
          <div className={styles.tableControls}>
            <select
              className={styles.filterSelect}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">Semua Departemen</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Support">Support</option>
            </select>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Cari karyawan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>KPI Utama</th>
                <th>Bobot</th>
                <th>Progres</th>
                <th>Skor</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    {search ? 'Tidak ada karyawan yang cocok.' : 'Belum ada data KPI untuk periode ini.'}
                  </td>
                </tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className={styles.empCell}>
                        <div className={styles.empAvatar} style={{ background: emp.avatarBg || 'var(--accent-dim)', color: emp.avatarColor || 'var(--accent)' }}>
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className={styles.empName}>{emp.name}</div>
                          <div className={styles.empDept}>{emp.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.kpiName}>{emp.main_kpi}</td>
                    <td><span className={styles.weightPill}>{emp.weight}%</span></td>
                    <td><ProgressBar pct={emp.progress_pct} /></td>
                    <td>
                      <span className={`${styles.scoreVal} ${styles[`score${getChipColor(emp.total_score)}`]}`}>
                        {emp.total_score}
                      </span>
                    </td>
                    <td><StatusChip label={emp.grade} color={getChipColor(emp.total_score)} /></td>
                    <td><StatusChip label={getStatusLabel(emp.total_score)} color={getChipColor(emp.total_score)} /></td>
                    <td>
                      <button className={styles.actionBtn}>Detail</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <KpiModal
          onClose={() => setShowModal(false)}
          onSaved={loadAll}
          employees={employees}
          categories={categories}
        />
      )}
    </div>
  )
}