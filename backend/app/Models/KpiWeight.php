<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiWeight extends Model
{
    protected $fillable = [
        'period_id', 'employee_id', 'manager_id',
        'category_id', 'weight', 'target_value', 'notes',
    ];

    protected $casts = [
        'weight'       => 'float',
        'target_value' => 'float',
    ];

    // ── Relasi ────────────────────────────────
    public function period()   { return $this->belongsTo(Period::class); }
    public function employee() { return $this->belongsTo(User::class, 'employee_id'); }
    public function manager()  { return $this->belongsTo(User::class, 'manager_id'); }
    public function category() { return $this->belongsTo(KpiCategory::class, 'category_id'); }
    public function tasks()    { return $this->hasMany(Task::class, 'weight_id'); }
}