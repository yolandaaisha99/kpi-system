// ============================================================
// KPI SYSTEM — CLOUD FIRESTORE (NoSQL)
// Koleksi fleksibel untuk data dinamis & real-time
// ============================================================

// KOLEKSI 1: evaluationComments
// Komentar evaluasi fleksibel dari manajer ke karyawan
// Path: evaluationComments/{commentId}
{
  "commentId": "auto-generated",
  "evaluationId": 1,           // FK ke evaluations.id di MySQL
  "periodId": 1,
  "employeeId": 2,
  "managerId": 1,
  "type": "general",           // "general" | "strength" | "improvement" | "action_plan"
  "content": "Andi menunjukkan performa baik di penyelesaian tiket, namun perlu meningkatkan dokumentasi API.",
  "isPrivate": false,          // true = hanya manajer yang lihat
  "tags": ["dokumentasi", "pengembangan"],
  "createdAt": "2026-05-31T10:00:00Z",
  "updatedAt": "2026-05-31T10:00:00Z"
}

// KOLEKSI 2: workEvidence
// Bukti progres kerja yang diupload karyawan
// Path: workEvidence/{evidenceId}
{
  "evidenceId": "auto-generated",
  "taskId": 1,                 // FK ke tasks.id di MySQL
  "employeeId": 2,
  "periodId": 1,
  "type": "screenshot",        // "screenshot" | "document" | "link" | "report"
  "title": "Screenshot tiket selesai batch Mei W1",
  "description": "Bukti 25 tiket selesai minggu pertama",
  "fileUrl": "gs://kpi-system-bucket/evidence/2026/05/andi-tiket-w1.png",
  "thumbnailUrl": "gs://kpi-system-bucket/thumbs/andi-tiket-w1-thumb.png",
  "fileSize": 204800,          // bytes
  "mimeType": "image/png",
  "status": "pending",         // "pending" | "verified" | "rejected"
  "verifiedBy": null,
  "verifiedAt": null,
  "uploadedAt": "2026-05-07T09:30:00Z"
}

// KOLEKSI 3: notifications
// Notifikasi real-time ke karyawan
// Path: notifications/{notifId}
{
  "notifId": "auto-generated",
  "recipientId": 2,            // userId penerima
  "senderId": 1,               // userId pengirim (manajer/sistem)
  "type": "kpi_assigned",
  // Tipe notifikasi:
  // "kpi_assigned"     — manajer assign bobot KPI baru
  // "target_reminder"  — pengingat target mendekati deadline
  // "evaluation_done"  — hasil evaluasi sudah bisa dilihat
  // "progress_low"     — progres di bawah ekspektasi
  // "evidence_verified"— bukti kerja sudah diverifikasi
  "title": "Bobot KPI Bulan Mei Sudah Ditetapkan",
  "body":  "Manajer kamu sudah menetapkan target KPI untuk periode Mei 2026. Yuk cek sekarang!",
  "data": {
    "periodId": 1,
    "screen": "kpi_detail"    // deep link ke screen di mobile app
  },
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-05-01T08:00:00Z"
}

// KOLEKSI 4: activityLogs
// Log semua aktivitas update karyawan (audit trail)
// Path: activityLogs/{logId}
{
  "logId": "auto-generated",
  "userId": 2,
  "employeeId": 2,
  "periodId": 1,
  "action": "progress_update",
  // Tipe action:
  // "progress_update"  — karyawan update nilai progres
  // "evidence_upload"  — karyawan upload bukti
  // "login"            — login ke aplikasi
  // "kpi_viewed"       — karyawan buka halaman KPI
  "detail": {
    "taskId": 1,
    "taskTitle": "Penyelesaian Tiket",
    "previousValue": 65,
    "newValue": 90,
    "changePercent": "+38.5%"
  },
  "ipAddress": "103.x.x.x",
  "userAgent": "KPI-Mobile/1.0 Flutter",
  "timestamp": "2026-05-20T14:22:00Z"
}

// KOLEKSI 5: chatThreads (opsional — fitur tambahan)
// Thread diskusi antara manajer dan karyawan per evaluasi
// Path: chatThreads/{threadId}/messages/{messageId}
{
  "threadId": "auto-generated",
  "evaluationId": 1,
  "participants": [1, 2],      // manager + employee userId
  "lastMessage": "Baik Pak, saya akan tingkatkan dokumentasi bulan depan.",
  "lastMessageAt": "2026-05-31T11:00:00Z",
  "messages": [
    {
      "messageId": "msg_001",
      "senderId": 1,
      "content": "Andi, progress dokumentasimu masih 30%. Tolong dikejar ya.",
      "sentAt": "2026-05-31T10:30:00Z"
    },
    {
      "messageId": "msg_002",
      "senderId": 2,
      "content": "Baik Pak, saya akan tingkatkan dokumentasi bulan depan.",
      "sentAt": "2026-05-31T11:00:00Z"
    }
  ]
}
