<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel periods
        Schema::create('periods', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->year('year');
            $table->unsignedTinyInteger('month');   // 1-12
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['year', 'month']);
        });

        // Tabel kpi_categories
        Schema::create('kpi_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('unit', 50)->nullable();     // tiket, %, Rp, dll
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_categories');
        Schema::dropIfExists('periods');
    }
};
