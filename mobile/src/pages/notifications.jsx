import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import styles from './notifications.module.css'

const ICONS = {
  kpi_assigned:      { emoji: '⚖',  label: 'KPI Ditetapkan' },
  evaluation_done:   { emoji: '✅',  label: 'Evaluasi Selesai' },
  progress_low:      { emoji: '⚠️', label: 'Progres Rendah' },
  target_reminder:   { emoji: '⏰', label: 'Pengingat Target' },
  evidence_verified: { emoji: '📎',  label: 'Bukti Diverifikasi' },
}

function timeAgo(timestamp) {
  if (!timestamp) return ''
  try {
    const date  = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp)
    const diff  = (Date.now() - date.getTime()) / 1000
    if (diff < 60)   return 'Baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400)return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
  } catch { return '' }
}

export default function Notifications() {
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  useEffect(() => {
    api.get('/notifications')
      .then(r => setNotifs(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function markRead(id) {
    setNotifs(n => n.map(item => item.id === id ? { ...item, isRead: true } : item))
    try { await api.patch(`/notifications/${id}/read`) } catch { /* silent */ }
  }

  async function readAll() {
    setNotifs(n => n.map(item => ({ ...item, isRead: true })))
    try { await api.post('/notifications/read-all') } catch { /* silent */ }
  }

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Kembali</button>
        <span className={styles.topbarTitle}>Notifikasi</span>
        {unread > 0 && (
          <button className={styles.readAllBtn} onClick={readAll}>Baca semua</button>
        )}
        {unread === 0 && <div style={{width:80}} />}
      </div>

      {unread > 0 && (
        <div className={styles.unreadBanner}>
          {unread} notifikasi belum dibaca
        </div>
      )}

      <div className={styles.list}>
        {loading && (
          <div className={styles.empty}>
            <div style={{width:20,height:20,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 8px'}} />
            Memuat...
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔔</div>
            <p className={styles.emptyTitle}>Belum ada notifikasi</p>
            <p className={styles.emptySub}>Notifikasi dari manajer akan muncul di sini</p>
          </div>
        )}

        {!loading && notifs.map(notif => {
          const icon = ICONS[notif.type] || { emoji: '📢', label: 'Info' }
          return (
            <div
              key={notif.id}
              className={`${styles.notifCard} ${!notif.isRead ? styles.unread : ''}`}
              onClick={() => markRead(notif.id)}
            >
              <div className={styles.notifIcon}>{icon.emoji}</div>
              <div className={styles.notifBody}>
                <div className={styles.notifMeta}>
                  <span className={styles.notifType}>{icon.label}</span>
                  <span className={styles.notifTime}>{timeAgo(notif.createdAt)}</span>
                </div>
                <p className={styles.notifTitle}>{notif.title}</p>
                <p className={styles.notifMessage}>{notif.body}</p>
              </div>
              {!notif.isRead && <div className={styles.unreadDot} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
