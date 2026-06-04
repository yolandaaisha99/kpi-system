<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'period_id', 'employee_id', 'weight_id',
        'title', 'description', 'target',
        'deadline', 'priority', 'status',
    ];

    protected $casts = [
        'target'   => 'float',
        'deadline' => 'date',
    ];

    // ── Relasi ────────────────────────────────
    public function period()     { return $this->belongsTo(Period::class); }
    public function employee()   { return $this->belongsTo(User::class, 'employee_id'); }
    public function kpiWeight()  { return $this->belongsTo(KpiWeight::class, 'weight_id'); }
    public function progresses() { return $this->hasMany(TaskProgress::class); }

    public function latestProgress()
    {
        return $this->hasOne(TaskProgress::class)->latestOfMany();
    }

    // ── Helper: hitung persentase progres ─────
    public function getProgressPercentageAttribute(): float
    {
        $latest = $this->latestProgress;
        if (!$latest || $this->target <= 0) return 0;
        return min(100, round(($latest->progress_value / $this->target) * 100, 1));
    }
}