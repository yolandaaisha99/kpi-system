<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = [
        'period_id', 'employee_id', 'manager_id',
        'total_score', 'status',
        'submitted_at', 'approved_at',
    ];

    protected $casts = [
        'total_score'  => 'float',
        'submitted_at' => 'datetime',
        'approved_at'  => 'datetime',
    ];

    // ── Relasi ────────────────────────────────
    public function period()   { return $this->belongsTo(Period::class); }
    public function employee() { return $this->belongsTo(User::class, 'employee_id'); }
    public function manager()  { return $this->belongsTo(User::class, 'manager_id'); }

    // ── Grade dihitung otomatis (accessor) ────
    public function getGradeAttribute(): string
    {
        return match (true) {
            $this->total_score >= 90 => 'A',
            $this->total_score >= 75 => 'B',
            $this->total_score >= 60 => 'C',
            $this->total_score >= 50 => 'D',
            default                  => 'E',
        };
    }

    // ── Append grade ke JSON output ───────────
    protected $appends = ['grade'];
}