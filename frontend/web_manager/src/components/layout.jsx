import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import styles from './layout.module.css'

const NAV_ITEMS = [
  { to: '/',            icon: '▣', label: 'Dashboard',      end: true },
  { to: '/employees',   icon: '👥', label: 'Karyawan' },
  { to: '/kpi-weights', icon: '⚖', label: 'Input Bobot KPI' },
  { to: '/evaluations', icon: '✅', label: 'Penilaian' },
  { to: '/reports',     icon: '📋', label: 'Laporan' },
]

export default function Layout() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('kpi_user') || '{}')

  function handleLogout() {
    localStorage.removeItem('kpi_token')
    localStorage.removeItem('kpi_user')
    navigate('/login')
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MG'

  return (
    <div className={styles.layout}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>📊</div>
          <div>
            <div className={styles.logoText}>KPI Manager</div>
            <div className={styles.logoSub}>Sistem Evaluasi Karyawan</div>
          </div>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Menu Utama</span>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name || 'Manajer'}</div>
            <div className={styles.userRole}>Manager</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            ↩
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}