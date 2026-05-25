<?php
// ── Model: Period ──────────────────────────────────────────
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Period extends Model
{
    protected $fillable = ['name', 'year', 'month', 'start_date', 'end_date', 'is_active'];
    protected $casts    = ['is_active' => 'boolean', 'start_date' => 'date', 'end_date' => 'date'];

    public function kpiWeights() { return $this->hasMany(KpiWeight::class); }
    public function tasks()      { return $this->hasMany(Task::class); }
    public function evaluations(){ return $this->hasMany(Evaluation::class); }

    public static function active(): ?self
    {
        return self::where('is_active', true)->first();
    }
}