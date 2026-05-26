<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel kpi_weights — bobot KPI per karyawan per periode
        Schema::create('kpi_weights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('periods')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('kpi_categories')->restrictOnDelete();
            $table->decimal('weight', 5, 2);            // bobot dalam %, total harus = 100
            $table->decimal('target_value', 12, 2);     // nilai target kuantitatif
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['period_id', 'employee_id', 'category_id'], 'uq_weight');
        });

        // Tabel tasks — target tugas per karyawan
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('periods')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('weight_id')->constrained('kpi_weights')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->decimal('target', 12, 2);
            $table->date('deadline')->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'overdue'])->default('pending');
            $table->timestamps();
        });

        // Tabel task_progress — histori update progres karyawan
        Schema::create('task_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('progress_value', 12, 2);
            $table->text('notes')->nullable();
            $table->string('evidence_url', 500)->nullable();  // URL ke Cloud Storage
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_progress');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('kpi_weights');
    }
};
