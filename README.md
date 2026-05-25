# KPI System — Sistem Penilaian Kinerja Karyawan
## Proyek Akhir Praktikum Teknologi Cloud Computing

---

## Struktur Project

```
kpi-system/
├── database/
│   ├── schema.sql              ← Struktur tabel Cloud SQL (MySQL)
│   └── firestore-schema.js     ← Dokumentasi koleksi Firestore
│
├── web-manager/
│   └── index.html              ← Dashboard Web untuk Manajer (dark modern)
│
├── mobile-app/
│   └── index.html              ← PWA Mobile untuk Karyawan
│
├── backend-api/
│   ├── routes/api.php          ← Definisi endpoint REST API
│   └── controllers/
│       ├── TaskProgressController.php   ← Update progres + Firestore log
│       └── EvaluationController.php     ← Hitung skor KPI otomatis
│
└── README.md                   ← Dokumentasi ini
```

---

## Arsitektur Sistem

```
[Manajer — Browser]                    [Karyawan — HP]
      |                                       |
   Web App                              Mobile PWA
 (web-manager/)                       (mobile-app/)
      |                                       |
      └──────────────┬────────────────────────┘
                     ↓
            REST API — Laravel
           (Google Cloud Run)
                     |
          ┌──────────┴──────────┐
          ↓                     ↓
    Cloud SQL (MySQL)      Cloud Firestore
    via phpMyAdmin          (NoSQL - realtime)
    - users                - activityLogs
    - kpi_weights          - evaluationComments
    - tasks                - workEvidence
    - task_progress        - notifications
    - evaluations
    - reports
```

---

## Setup & Deploy di Google Cloud Platform

### 1. Buat Project GCP
```bash
gcloud projects create kpi-system-2026
gcloud config set project kpi-system-2026
```

### 2. Aktifkan Services
```bash
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com
```

### 3. Buat Cloud SQL (MySQL)
```bash
gcloud sql instances create kpi-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-southeast2

gcloud sql databases create kpi_system --instance=kpi-db
gcloud sql users set-password root --host=% --instance=kpi-db --password=YOUR_PASSWORD
```

### 4. phpMyAdmin — Akses Cloud SQL
- Buka Cloud Shell di GCP Console
- Jalankan: `gcloud sql connect kpi-db --user=root`
- Atau setup phpMyAdmin di Cloud Run dengan image docker `phpmyadmin/phpmyadmin`
- Import file `database/schema.sql` untuk membuat semua tabel

### 5. Setup Firestore
```bash
gcloud firestore databases create --region=asia-southeast2
```

### 6. Deploy Backend Laravel ke Cloud Run
```bash
# Di folder backend Laravel
gcloud run deploy kpi-api \
  --source . \
  --region=asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars DB_CONNECTION=mysql,DB_HOST=YOUR_CLOUD_SQL_IP
```

### 7. Deploy Web Manajer ke Cloud Storage (Static Hosting)
```bash
gsutil mb gs://kpi-web-manager
gsutil web set -m index.html gs://kpi-web-manager
gsutil cp web-manager/* gs://kpi-web-manager/
gsutil iam ch allUsers:objectViewer gs://kpi-web-manager
```

### 8. Deploy Mobile PWA ke Cloud Storage
```bash
gsutil mb gs://kpi-mobile-app
gsutil web set -m index.html gs://kpi-mobile-app
gsutil cp mobile-app/* gs://kpi-mobile-app/
gsutil iam ch allUsers:objectViewer gs://kpi-mobile-app
```

---

## Variabel Environment Backend Laravel (.env)

```env
APP_NAME="KPI System"
APP_ENV=production
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=YOUR_CLOUD_SQL_PUBLIC_IP
DB_PORT=3306
DB_DATABASE=kpi_system
DB_USERNAME=root
DB_PASSWORD=YOUR_PASSWORD

GCP_PROJECT_ID=kpi-system-2026
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

FILESYSTEM_DISK=gcs
GCS_BUCKET=kpi-evidence-bucket
```

---

## Fitur Utama

### Platform 1 — Web Manajer
| Fitur | Keterangan |
|-------|------------|
| Dashboard | Ringkasan metrik: total karyawan, rata-rata KPI, yang di bawah target |
| Input Bobot KPI | Form modal untuk set bobot & target per karyawan |
| Tabel Evaluasi | Progress bar + skor + grade tiap karyawan |
| Generate Evaluasi | Hitung skor otomatis berdasarkan bobot × progres |
| Approve & Notif | Approve hasil → notifikasi otomatis ke karyawan |
| Filter & Cari | Filter by departemen, search by nama |

### Platform 2 — Mobile Karyawan (PWA)
| Fitur | Keterangan |
|-------|------------|
| Ring Score | Visualisasi skor KPI bulan ini |
| Task List | Daftar target aktif + progress bar per task |
| Update Progres | Input nilai progres terbaru via bottom sheet |
| Upload Bukti | Upload foto/PDF bukti kerja ke Cloud Storage |
| Notifikasi | Terima notifikasi dari manajer real-time |
| PWA | Bisa di-install di HP seperti app native |

---

## Rumus Perhitungan Skor KPI

```
Skor KPI = Σ (Progres% × Bobot_i) / Total_Bobot

Contoh:
- Penyelesaian Tiket: 90% tercapai × bobot 40% = 36
- Code Review:        60% tercapai × bobot 35% = 21
- Dokumentasi:        30% tercapai × bobot 25% = 7.5
                                          Total = 64.5 / 100
```

| Grade | Rentang Skor |
|-------|-------------|
| A     | 90 – 100    |
| B     | 75 – 89     |
| C     | 60 – 74     |
| D     | 50 – 59     |
| E     | < 50        |

---

## Teknologi yang Digunakan

| Layer | Teknologi |
|-------|-----------|
| Cloud Provider | Google Cloud Platform |
| SQL Database | Cloud SQL (MySQL 8.0) |
| NoSQL Database | Cloud Firestore |
| File Storage | Cloud Storage (GCS) |
| Backend API | PHP Laravel (Cloud Run) |
| Web Manager | HTML + CSS + JavaScript |
| Mobile App | PWA (Progressive Web App) |
| DB Management | phpMyAdmin |
| Code Editor | Visual Studio Code |

---

*Proyek Akhir Praktikum Teknologi Cloud Computing*
