<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskProgress extends Model
{
    public const UPDATED_AT = 'updated_at';
    public const CREATED_AT = null; // tabel hanya punya updated_at

    protected $fillable = [
        'task_id', 'employee_id',
        'progress_value', 'notes', 'evidence_url',
    ];

    protected $casts = ['progress_value' => 'float'];

    // ── Relasi ────────────────────────────────
    public function task()     { return $this->belongsTo(Task::class); }
    public function employee() { return $this->belongsTo(User::class, 'employee_id'); }
}