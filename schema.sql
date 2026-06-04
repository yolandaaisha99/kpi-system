-- ============================================================
-- KPI SYSTEM — CLOUD SQL (MySQL)
-- Sistem Penilaian Kinerja Karyawan
-- Kelola via phpMyAdmin di Google Cloud Platform
-- ============================================================

CREATE DATABASE IF NOT EXISTS kpi_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kpi_system;

-- ------------------------------------------------------------
-- TABEL: personal_access_tokens
-- Menyimpan token API (Sanctum) untuk autentikasi Mobile/Web
-- ------------------------------------------------------------
CREATE TABLE personal_access_tokens (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tokenable_type varchar(255) NOT NULL,
  tokenable_id bigint(20) unsigned NOT NULL,
  name varchar(255) NOT NULL,
  token varchar(64) NOT NULL UNIQUE,
  abilities text,
  last_used_at timestamp NULL DEFAULT NULL,
  expires_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX personal_access_tokens_tokenable_type_tokenable_id_index (tokenable_type, tokenable_id)
);

-- ------------------------------------------------------------
-- TABEL: users
-- Menyimpan data manajer dan karyawan
-- ------------------------------------------------------------
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('manager','employee') NOT NULL DEFAULT 'employee',
  department  VARCHAR(100),
  position    VARCHAR(100),
  avatar_url  VARCHAR(255),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABEL: periods
-- Periode evaluasi (bulanan)
-- ------------------------------------------------------------
CREATE TABLE periods (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL,       -- e.g. "Mei 2026"
  year       YEAR NOT NULL,
  month      TINYINT UNSIGNED NOT NULL,  -- 1-12
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_period (year, month)
);

-- ------------------------------------------------------------
-- TABEL: kpi_categories
-- Kategori/indikator KPI (contoh: Penyelesaian Tiket, dll)
-- ------------------------------------------------------------
CREATE TABLE kpi_categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  unit        VARCHAR(50),               -- satuan: tiket, %, Rp, dll
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABEL: kpi_weights
-- Bobot KPI per karyawan per periode (diisi manajer)
-- ------------------------------------------------------------
CREATE TABLE kpi_weights (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id       INT UNSIGNED NOT NULL,
  employee_id     INT UNSIGNED NOT NULL,
  manager_id      INT UNSIGNED NOT NULL,
  category_id     INT UNSIGNED NOT NULL,
  weight          DECIMAL(5,2) NOT NULL,   -- bobot dalam %, jumlah harus = 100
  target_value    DECIMAL(12,2) NOT NULL,  -- nilai target yang harus dicapai
  notes           TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id)   REFERENCES periods(id)        ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (manager_id)  REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES kpi_categories(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_weight (period_id, employee_id, category_id)
);

-- ------------------------------------------------------------
-- TABEL: tasks
-- Target tugas spesifik per karyawan per periode
-- ------------------------------------------------------------
CREATE TABLE tasks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id   INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  weight_id   INT UNSIGNED NOT NULL,     -- terhubung ke bobot KPI
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  target      DECIMAL(12,2) NOT NULL,   -- target kuantitatif
  deadline    DATE,
  priority    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status      ENUM('pending','in_progress','completed','overdue') NOT NULL DEFAULT 'pending',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id)   REFERENCES periods(id)     ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (weight_id)   REFERENCES kpi_weights(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- TABEL: task_progress
-- Histori update progres tugas oleh karyawan
-- ------------------------------------------------------------
CREATE TABLE task_progress (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id         INT UNSIGNED NOT NULL,
  employee_id     INT UNSIGNED NOT NULL,
  progress_value  DECIMAL(12,2) NOT NULL, -- nilai progres saat update
  notes           TEXT,
  evidence_url    VARCHAR(500),            -- URL ke Firestore/Cloud Storage
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- TABEL: evaluations
-- Hasil evaluasi akhir per karyawan per periode
-- ------------------------------------------------------------
CREATE TABLE evaluations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id     INT UNSIGNED NOT NULL,
  employee_id   INT UNSIGNED NOT NULL,
  manager_id    INT UNSIGNED NOT NULL,
  total_score   DECIMAL(5,2) NOT NULL DEFAULT 0,  -- skor akhir 0-100
  grade         ENUM('A','B','C','D','E') GENERATED ALWAYS AS (
                  CASE
                    WHEN total_score >= 90 THEN 'A'
                    WHEN total_score >= 75 THEN 'B'
                    WHEN total_score >= 60 THEN 'C'
                    WHEN total_score >= 50 THEN 'D'
                    ELSE 'E'
                  END
                ) VIRTUAL,
  status        ENUM('draft','submitted','approved') NOT NULL DEFAULT 'draft',
  submitted_at  DATETIME,
  approved_at   DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id)   REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (manager_id)  REFERENCES users(id)   ON DELETE CASCADE,
  UNIQUE KEY uq_evaluation (period_id, employee_id)
);

-- ------------------------------------------------------------
-- TABEL: reports
-- Laporan ringkasan manajer per periode
-- ------------------------------------------------------------
CREATE TABLE reports (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id   INT UNSIGNED NOT NULL,
  manager_id  INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  summary     TEXT,
  avg_score   DECIMAL(5,2),
  top_performer_id   INT UNSIGNED,
  lowest_performer_id INT UNSIGNED,
  total_employees    INT UNSIGNED,
  published_at DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id)             REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id)            REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (top_performer_id)      REFERENCES users(id)   ON DELETE SET NULL,
  FOREIGN KEY (lowest_performer_id)   REFERENCES users(id)   ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- SAMPLE DATA — untuk testing
-- ------------------------------------------------------------

INSERT INTO users (name, email, password, role, department, position) VALUES
('Budi Manajer',   'manager@kpi.app',  '$2y$12$LJ3m4ys3Lg8GbvMBOVERuOTGnk1B7t0l5RHvSzYnBnFpVqC6pX0TS', 'manager',  'Engineering', 'Engineering Manager'),
('Andi Pratama',   'andi@kpi.app',     '$2y$12$LJ3m4ys3Lg8GbvMBOVERuOTGnk1B7t0l5RHvSzYnBnFpVqC6pX0TS', 'employee', 'Engineering', 'Backend Developer'),
('Sari Lestari',   'sari@kpi.app',     '$2y$12$LJ3m4ys3Lg8GbvMBOVERuOTGnk1B7t0l5RHvSzYnBnFpVqC6pX0TS', 'employee', 'Sales',       'Sales Executive'),
('Budi Santoso',   'budi@kpi.app',     '$2y$12$LJ3m4ys3Lg8GbvMBOVERuOTGnk1B7t0l5RHvSzYnBnFpVqC6pX0TS', 'employee', 'Engineering', 'QA Engineer'),
('Dewi Rahayu',    'dewi@kpi.app',     '$2y$12$LJ3m4ys3Lg8GbvMBOVERuOTGnk1B7t0l5RHvSzYnBnFpVqC6pX0TS', 'employee', 'Support',     'Customer Support');
-- Catatan: Semua password = 'password123' (bcrypt hash)
-- Atau gunakan Laravel seeder: php artisan db:seed

INSERT INTO periods (name, year, month, start_date, end_date, is_active) VALUES
('Mei 2026', 2026, 5, '2026-05-01', '2026-05-31', 1),
('April 2026', 2026, 4, '2026-04-01', '2026-04-30', 0);

INSERT INTO kpi_categories (name, description, unit) VALUES
('Penyelesaian Tiket',    'Jumlah tiket support/dev yang diselesaikan', 'tiket'),
('Target Revenue',        'Pencapaian target penjualan bulanan',         'Rp'),
('Bug Resolution Rate',   'Persentase bug yang berhasil diselesaikan',   '%'),
('Kepuasan Pelanggan',    'Rata-rata skor kepuasan pelanggan (CSAT)',    'skor'),
('Code Review',           'Jumlah pull request yang di-review',          'PR'),
('Dokumentasi',           'Jumlah dokumen teknis yang dibuat/update',    'dokumen');

INSERT INTO kpi_weights (period_id, employee_id, manager_id, category_id, weight, target_value) VALUES
(1, 2, 1, 1, 40.00, 100),  -- Andi: Tiket 40%, target 100 tiket
(1, 2, 1, 5, 35.00,  20),  -- Andi: Code Review 35%, target 20 PR
(1, 2, 1, 6, 25.00,  10),  -- Andi: Dokumentasi 25%, target 10 dok
(1, 3, 1, 2, 50.00, 50000000), -- Sari: Revenue 50%
(1, 4, 1, 3, 35.00, 100),  -- Budi S: Bug Rate 35%
(1, 5, 1, 4, 30.00, 4.5);  -- Dewi: CSAT 30%
