<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'period_id', 'manager_id', 'title', 'summary',
        'avg_score', 'top_performer_id', 'lowest_performer_id',
        'total_employees', 'published_at',
    ];

    protected $casts = [
        'avg_score'    => 'float',
        'published_at' => 'datetime',
    ];

    public function period()          { return $this->belongsTo(Period::class); }
    public function manager()         { return $this->belongsTo(User::class, 'manager_id'); }
    public function topPerformer()    { return $this->belongsTo(User::class, 'top_performer_id'); }
    public function lowestPerformer() { return $this->belongsTo(User::class, 'lowest_performer_id'); }
}