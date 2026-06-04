<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'name', 'username', 'email', 'password',
        'role', 'department', 'position',
        'avatar_url', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active'         => 'boolean',
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    // ── Relasi ────────────────────────────────
    public function kpiWeights()
    {
        return $this->hasMany(KpiWeight::class, 'employee_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'employee_id');
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'employee_id');
    }

    public function managedWeights()
    {
        return $this->hasMany(KpiWeight::class, 'manager_id');
    }

    // ── Helpers ───────────────────────────────
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }
}