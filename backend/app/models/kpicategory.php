<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiCategory extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'description', 'unit', 'is_active'];
    protected $casts    = ['is_active' => 'boolean'];

    public function kpiWeights()
    {
        return $this->hasMany(KpiWeight::class, 'category_id');
    }
}