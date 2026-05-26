<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel evaluations — hasil penilaian akhir
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('periods')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('total_score', 5, 2)->default(0);   // 0.00 - 100.00
            $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->unique(['period_id', 'employee_id'], 'uq_evaluation');
        });

        // Tabel reports — laporan manajer per periode
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('periods')->cascadeOnDelete();
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('summary')->nullable();
            $table->decimal('avg_score', 5, 2)->nullable();
            $table->foreignId('top_performer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('lowest_performer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('total_employees')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        // Tabel Sanctum — API tokens
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('evaluations');
    }
};
