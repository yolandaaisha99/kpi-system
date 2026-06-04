<?php

// ============================================================
// KPI SYSTEM — routes/api.php
// Semua endpoint REST API Laravel
// Base URL: /api
// ============================================================

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KpiWeightController;
use App\Http\Controllers\TaskProgressController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ChatController;

// ──────────────────────────────────────────────────────────
// PUBLIC ROUTES — tidak perlu login
// ──────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);    // POST /api/auth/login
    Route::post('/register', [AuthController::class, 'register']); // POST /api/auth/register
});

// Setup manager pertama (controller-based, bisa di-cache)
Route::post('/setup-manager', [AuthController::class, 'setupManager']);

// ──────────────────────────────────────────────────────────
// PROTECTED ROUTES — wajib login (token Sanctum)
// ──────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──────────────────────────────────
    Route::post('/auth/logout', [AuthController::class, 'logout']); // POST /api/auth/logout
    Route::get('/auth/me',      [AuthController::class, 'me']);     // GET  /api/auth/me
    Route::post('/auth/refresh', [AuthController::class, 'refresh']); // POST /api/auth/refresh

    // ── Dashboard (manajer) ───────────────────
    Route::get('/dashboard', [DashboardController::class, 'index']); // GET /api/dashboard

    // ── KPI Categories (semua user bisa lihat) ─
    Route::get('/kpi-categories', [KpiWeightController::class, 'categories']); // GET /api/kpi-categories

    // ── Employees dropdown ────────────────────
    Route::get('/employees', [KpiWeightController::class, 'employees']); // GET /api/employees

    // ── Periods (semua user bisa lihat) ───────
    Route::get('/periods', [PeriodController::class, 'index']); // GET /api/periods

    // ────────────────────────────────────────────────────────
    // MANAGER ONLY — hanya role manager yang bisa akses
    // ────────────────────────────────────────────────────────
    Route::middleware('role:manager')->group(function () {

        // KPI Weights — input & kelola bobot KPI
        Route::get('/kpi-weights',         [KpiWeightController::class, 'index']);   // GET    /api/kpi-weights
        Route::post('/kpi-weights',        [KpiWeightController::class, 'store']);   // POST   /api/kpi-weights
        Route::put('/kpi-weights/{id}',    [KpiWeightController::class, 'update']);  // PUT    /api/kpi-weights/{id}
        Route::delete('/kpi-weights/{id}', [KpiWeightController::class, 'destroy']); // DELETE /api/kpi-weights/{id}

        // Evaluasi — generate skor & approve
        Route::get('/evaluations',               [EvaluationController::class, 'index']);    // GET  /api/evaluations
        Route::post('/evaluations/generate',     [EvaluationController::class, 'generate']); // POST /api/evaluations/generate
        Route::post('/evaluations/{id}/approve', [EvaluationController::class, 'approve']);  // POST /api/evaluations/{id}/approve

        // Periods — kelola periode evaluasi
        Route::post('/periods',       [PeriodController::class, 'store']);   // POST   /api/periods
        Route::put('/periods/{id}',   [PeriodController::class, 'update']);  // PUT    /api/periods/{id}
        Route::delete('/periods/{id}',[PeriodController::class, 'destroy']); // DELETE /api/periods/{id}

        // Reports — laporan ringkasan per periode
        Route::get('/reports',            [ReportController::class, 'index']);    // GET    /api/reports
        Route::post('/reports/generate',  [ReportController::class, 'generate']); // POST   /api/reports/generate
        Route::get('/reports/{id}',       [ReportController::class, 'show']);     // GET    /api/reports/{id}
        Route::delete('/reports/{id}',    [ReportController::class, 'destroy']);  // DELETE /api/reports/{id}
    });

    // ────────────────────────────────────────────────────────
    // EMPLOYEE — akses karyawan
    // ────────────────────────────────────────────────────────

    // Task & Progres
    Route::get('/tasks',                          [TaskProgressController::class, 'myTasks']); // GET  /api/tasks
    Route::post('/task-progress',                 [TaskProgressController::class, 'store']);   // POST /api/task-progress
    Route::get('/task-progress/history/{taskId}', [TaskProgressController::class, 'history']); // GET  /api/task-progress/history/{taskId}

    // Evaluasi milik sendiri (karyawan lihat hasil sendiri)
    Route::get('/evaluations/my', [EvaluationController::class, 'myEvaluation']); // GET /api/evaluations/my

    // Notifikasi (dari Firestore)
    Route::get('/notifications',             [NotificationController::class, 'index']);    // GET   /api/notifications
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']); // PATCH /api/notifications/{id}/read
    Route::post('/notifications/read-all',   [NotificationController::class, 'readAll']);  // POST  /api/notifications/read-all

    // Chat threads (Firestore — koleksi ke-5)
    Route::get('/chats',           [ChatController::class, 'index']); // GET  /api/chats
    Route::get('/chats/{threadId}',[ChatController::class, 'show']);  // GET  /api/chats/{threadId}
    Route::post('/chats',          [ChatController::class, 'store']); // POST /api/chats
});