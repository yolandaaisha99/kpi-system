import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './home.module.css'

// ── Ring Score Component ────────────────────
function ScoreRing({ score }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 75 ? '#22d9a5' : score >= 50 ? '#f5a623' : '#ff5e5e'
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'E'

  return (
    <div className={styles.scoreCard}>
      <div className={styles.ringWrap}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r}
            fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className={styles.ringCenter}>
          <span className={styles.ringPct} style={{ color }}>{score}%</span>
        </div>
      </div>
      <div className={styles.scoreInfo}>
        <p className={styles.scoreLabel}>Skor KPI Bulan Ini</p>
        <p className={styles.scoreVal}>{score} <span>/100</span></p>
        <p className={styles.scoreTrend}>↑ +6 poin dari minggu lalu</p>
      </div>
      <div className={styles.gradeTag} style={{ color, borderColor: color + '40', background: color + '18' }}>
        {grade}
      </div>
    </div>
  )
}

// ── Task Card Component ─────────────────────
function TaskCard({ task, onUpdate }) {
  const pct = Math.min(100, Math.round((task.current_value / task.target) * 100))
  const color = pct >= 75 ? 'green' : pct >= 50 ? 'warn' : 'danger'
  const statusLabel = pct >= 75 ? 'On Track ✓' : pct >= 50 ? 'Perlu Usaha' : 'Tertinggal !'

  return (
    <div className={`${styles.taskCard} ${styles[color]}`} onClick={() => onUpdate(task)}>
      <div className={styles.taskHeader}>
        <span className={styles.taskName}>{task.title}</span>
        <span className={styles.taskWeight}>Bobot {task.weight}%</span>
      </div>
      <div className={styles.taskBarBg}>
        <div className={`${styles.taskBarFill} ${styles[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.taskFooter}>
        <span className={styles.taskProgress}>{task.current_value} / {task.target} {task.unit}</span>
        <span className={`${styles.taskStatus} ${styles[`status_${color}`]}`}>{statusLabel}</span>
      </div>
    </div>
  )
}

// ── Update Sheet Component ──────────────────
function UpdateSheet({ task, onClose, onSaved }) {
  const [value, setValue] = useState(task?.current_value || '')
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!value) { setError('Masukkan nilai progres dulu ya!'); return }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('task_id', task.id)
      formData.append('progress_value', value)
      formData.append('notes', note)
      if (file) formData.append('evidence', file)

      await api.post('/task-progress', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.sheetOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <h2 className={styles.sheetTitle}>Update Progres</h2>
        <p className={styles.sheetSub}>{task?.title} — Target: {task?.target} {task?.unit}</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <label className={styles.sheetLabel}>Nilai Progres Saat Ini</label>
        <input
          type="number"
          className={styles.sheetInput}
          placeholder={`0 — ${task?.target}`}
          value={value}
          onChange={e => setValue(e.target.value)}
        />

        <label className={styles.sheetLabel}>Catatan (opsional)</label>
        <input
          type="text"
          className={styles.sheetInputSm}
          placeholder="cth: Selesai 10 tiket hari ini"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <label className={styles.sheetLabel}>Upload Bukti Kerja</label>
        <label className={styles.uploadArea}>
          <input
            type="file"
            style={{ display: 'none' }}
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files[0])}
          />
          <div className={styles.uploadIcon}>📎</div>
          <div className={styles.uploadText}>
            {file ? file.name : 'Tap untuk upload foto atau dokumen'}
          </div>
          <div className={styles.uploadSub}>Screenshot, foto, atau PDF (max 5MB)</div>
        </label>

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Menyimpan...' : '↑ Simpan Update Progres'}
        </button>
      </div>
    </div>
  )
}

// ── Halaman Home Utama ──────────────────────
export default function Home() {
  const [tasks, setTasks] = useState([])
  const [score, setScore] = useState(0)
  const [period, setPeriod] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('kpi_user') || '{}')
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KY'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [taskRes, evalRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/evaluations/my'),
      ])
      setTasks(taskRes.data.data || [])
      setScore(evalRes.data.data?.total_score || 0)
      setPeriod(evalRes.data.data?.period)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-2)', gap: 12 }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Memuat...
    </div>
  )

  const firstName = user.name?.split(' ')[0] || 'Karyawan'
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'

  return (
    <div className={styles.page}>
      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div>
          <p className={styles.appName}>KPI Tracker</p>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.notifBtn} onClick={() => navigate('/notifications')}>
            🔔 <span className={styles.notifDot} />
          </div>
          <div className={styles.avatarBtn}>{initials}</div>
        </div>
      </div>

      {/* ── GREETING ── */}
      <div className={styles.greeting}>
        <p className={styles.greetingHi}>{greeting},</p>
        <h1 className={styles.greetingName}>{firstName} 👋</h1>
        <p className={styles.greetingSub}>Yuk update progres hari ini!</p>
      </div>

      {/* ── PERIOD ── */}
      <div className={styles.periodStrip}>
        <div>
          <p className={styles.periodLabel}>Periode Evaluasi</p>
          <p className={styles.periodDays}>11 hari tersisa</p>
        </div>
        <p className={styles.periodVal}>{period?.name || 'Mei 2026'}</p>
      </div>

      {/* ── SCORE RING ── */}
      <ScoreRing score={score} />

      {/* ── TASK LIST ── */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Target Aktif Bulan Ini</span>
        <span className={styles.sectionLink}>Lihat semua</span>
      </div>

      <div className={styles.taskList}>
        {tasks.length === 0
          ? <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>
              Belum ada target KPI. Tunggu manajer menetapkan bobot.
            </p>
          : tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={setSelectedTask} />
          ))
        }
      </div>

      {/* ── UPDATE BUTTON ── */}
      <div className={styles.floatBtnWrap}>
        <button className={styles.floatBtn} onClick={() => navigate('/update')}>
          ↑ Update Progres Sekarang
        </button>
      </div>

      {/* ── SHEET ── */}
      {selectedTask && (
        <UpdateSheet
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSaved={loadData}
        />
      )}
    </div>
  )
}