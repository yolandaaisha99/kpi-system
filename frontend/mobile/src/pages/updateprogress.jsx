import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './updateProgress.module.css'

export default function UpdateProgress() {
  const [tasks, setTasks]         = useState([])
  const [selected, setSelected]   = useState(null)
  const [value, setValue]         = useState('')
  const [note, setNote]           = useState('')
  const [file, setFile]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const navigate                  = useNavigate()

  useEffect(() => {
    api.get('/tasks')
      .then(r => {
        const taskList = r.data.data || []
        setTasks(taskList)
        if (taskList.length > 0) {
          setSelected(taskList[0])
          setValue(taskList[0].current_value || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoadingPage(false))
  }, [])

  function selectTask(task) {
    setSelected(task)
    setValue(task.current_value || '')
    setNote('')
    setFile(null)
    setError('')
  }

  async function handleSubmit() {
    if (!selected) { setError('Pilih target dulu!'); return }
    if (!value || isNaN(value)) { setError('Masukkan nilai progres yang valid.'); return }
    if (Number(value) < 0) { setError('Nilai tidak boleh negatif.'); return }

    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('task_id',        selected.id)
      formData.append('progress_value', value)
      formData.append('notes',          note)
      if (file) formData.append('evidence', file)

      await api.post('/task-progress', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const pct = selected && selected.target
    ? Math.min(100, Math.round((Number(value || 0) / selected.target) * 100))
    : 0

  if (loadingPage) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text-2)',gap:12}}>
      <div style={{width:20,height:20,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
      Memuat...
    </div>
  )

  if (success) return (
    <div className={styles.successPage}>
      <div className={styles.successIcon}>✓</div>
      <h2 className={styles.successTitle}>Progres Tersimpan!</h2>
      <p className={styles.successSub}>Kembali ke dashboard...</p>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Kembali</button>
        <span className={styles.topbarTitle}>Update Progres</span>
        <div style={{width:64}} />
      </div>

      <div className={styles.content}>
        {/* ── PILIH TARGET ── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Pilih Target</p>
          <div className={styles.taskPills}>
            {tasks.map(task => (
              <button
                key={task.id}
                className={`${styles.taskPill} ${selected?.id === task.id ? styles.pillActive : ''}`}
                onClick={() => selectTask(task)}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>

        {/* ── INFO TARGET ── */}
        {selected && (
          <div className={styles.targetCard}>
            <div className={styles.targetHeader}>
              <span className={styles.targetName}>{selected.title}</span>
              <span className={styles.targetWeight}>Bobot {selected.weight}%</span>
            </div>
            <div className={styles.targetMeta}>
              Target: <strong>{selected.target} {selected.unit}</strong>
              &nbsp;·&nbsp; Saat ini: <strong>{selected.current_value} {selected.unit}</strong>
            </div>

            {/* Preview progress bar */}
            <div className={styles.previewBarBg}>
              <div
                className={styles.previewBarFill}
                style={{
                  width: `${pct}%`,
                  background: pct >= 75 ? 'var(--accent)' : pct >= 50 ? 'var(--warn)' : 'var(--danger)'
                }}
              />
            </div>
            <div className={styles.previewPct}>{pct}% dari target</div>
          </div>
        )}

        {/* ── INPUT NILAI ── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Nilai Progres Sekarang</p>
          <div className={styles.inputWrap}>
            <input
              type="number"
              className={styles.bigInput}
              placeholder="0"
              value={value}
              min="0"
              max={selected?.target}
              onChange={e => setValue(e.target.value)}
            />
            <span className={styles.inputUnit}>{selected?.unit || ''}</span>
          </div>
        </div>

        {/* ── CATATAN ── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Catatan (opsional)</p>
          <textarea
            className={styles.textarea}
            placeholder="cth: Selesai 10 tiket hari ini, PR direview 3 buah"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {/* ── UPLOAD BUKTI ── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Upload Bukti Kerja</p>
          <label className={styles.uploadArea}>
            <input
              type="file"
              style={{display:'none'}}
              accept="image/*,.pdf"
              onChange={e => setFile(e.target.files[0])}
            />
            <span className={styles.uploadIcon}>📎</span>
            <span className={styles.uploadText}>
              {file ? file.name : 'Tap untuk upload screenshot atau dokumen'}
            </span>
            <span className={styles.uploadSub}>JPG, PNG, atau PDF (max 5MB)</span>
          </label>
          {file && (
            <button className={styles.removeFile} onClick={() => setFile(null)}>✕ Hapus file</button>
          )}
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {/* ── SUBMIT ── */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading || !selected}
        >
          {loading ? 'Menyimpan...' : '↑ Simpan Update Progres'}
        </button>
      </div>
    </div>
  )
}
