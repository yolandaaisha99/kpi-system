// src/pages/Reports.jsx
import styles from './Dashboard.module.css'
export default function Reports() {
  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Laporan Manajer</h1>
          <p className={styles.pageDesc}>Ringkasan evaluasi bulanan</p>
        </div>
        <button className={styles.btnPrimary}>+ Buat Laporan</button>
      </div>
      <div className={styles.content} style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60%',flexDirection:'column',gap:'12px'}}>
        <div style={{fontSize:'40px'}}>📋</div>
        <div style={{color:'var(--text-2)',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'16px'}}>Belum ada laporan</div>
        <div style={{color:'var(--text-3)',fontSize:'13px',textAlign:'center',maxWidth:'320px'}}>
          Laporan akan muncul setelah evaluasi di-approve.<br/>
          Pergi ke halaman Penilaian untuk approve evaluasi terlebih dahulu.
        </div>
      </div>
    </div>
  )
}