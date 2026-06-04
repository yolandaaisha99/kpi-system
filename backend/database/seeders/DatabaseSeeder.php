<?php

namespace Database\Seeders;

use App\Models\KpiCategory;
use App\Models\KpiWeight;
use App\Models\Period;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ─────────────────────────────────
        $manager = User::create([
            'name'       => 'Budi Manajer',
            'username'   => 'manager',
            'email'      => 'manager@kpi.app',
            'password'   => Hash::make('password123'),
            'role'       => 'manager',
            'department' => 'Engineering',
            'position'   => 'Engineering Manager',
        ]);

        $andi = User::create([
            'name'       => 'Andi Pratama',
            'username'   => 'andi',
            'email'      => 'andi@kpi.app',
            'password'   => Hash::make('password123'),
            'role'       => 'employee',
            'department' => 'Engineering',
            'position'   => 'Backend Developer',
        ]);

        $sari = User::create([
            'name'       => 'Sari Lestari',
            'username'   => 'sari',
            'email'      => 'sari@kpi.app',
            'password'   => Hash::make('password123'),
            'role'       => 'employee',
            'department' => 'Sales',
            'position'   => 'Sales Executive',
        ]);

        $budi = User::create([
            'name'       => 'Budi Santoso',
            'username'   => 'budi',
            'email'      => 'budi@kpi.app',
            'password'   => Hash::make('password123'),
            'role'       => 'employee',
            'department' => 'Engineering',
            'position'   => 'QA Engineer',
        ]);

        $dewi = User::create([
            'name'       => 'Dewi Rahayu',
            'username'   => 'dewi',
            'email'      => 'dewi@kpi.app',
            'password'   => Hash::make('password123'),
            'role'       => 'employee',
            'department' => 'Support',
            'position'   => 'Customer Support',
        ]);

        // ── Period ────────────────────────────────
        $period = Period::create([
            'name'       => 'Mei 2026',
            'year'       => 2026,
            'month'      => 5,
            'start_date' => '2026-05-01',
            'end_date'   => '2026-05-31',
            'is_active'  => true,
        ]);

        // ── KPI Categories ────────────────────────
        $tiket  = KpiCategory::create(['name' => 'Penyelesaian Tiket',  'unit' => 'tiket',  'description' => 'Jumlah tiket yang diselesaikan']);
        $revenue= KpiCategory::create(['name' => 'Target Revenue',      'unit' => 'Rp',     'description' => 'Pencapaian target penjualan']);
        $bug    = KpiCategory::create(['name' => 'Bug Resolution Rate',  'unit' => '%',      'description' => 'Persentase bug yang diselesaikan']);
        $csat   = KpiCategory::create(['name' => 'Kepuasan Pelanggan',  'unit' => 'skor',   'description' => 'Rata-rata skor CSAT']);
        $review = KpiCategory::create(['name' => 'Code Review',         'unit' => 'PR',     'description' => 'Jumlah pull request yang di-review']);
        $docs   = KpiCategory::create(['name' => 'Dokumentasi',         'unit' => 'dokumen','description' => 'Jumlah dokumen teknis dibuat']);

        // ── KPI Weights — Andi ────────────────────
        $w1 = KpiWeight::create(['period_id'=>$period->id,'employee_id'=>$andi->id,'manager_id'=>$manager->id,'category_id'=>$tiket->id, 'weight'=>40,'target_value'=>100]);
        $w2 = KpiWeight::create(['period_id'=>$period->id,'employee_id'=>$andi->id,'manager_id'=>$manager->id,'category_id'=>$review->id,'weight'=>35,'target_value'=>20]);
        $w3 = KpiWeight::create(['period_id'=>$period->id,'employee_id'=>$andi->id,'manager_id'=>$manager->id,'category_id'=>$docs->id,  'weight'=>25,'target_value'=>10]);

        // ── Tasks — Andi ──────────────────────────
        Task::create(['period_id'=>$period->id,'employee_id'=>$andi->id,'weight_id'=>$w1->id,'title'=>'Penyelesaian Tiket','target'=>100,'status'=>'in_progress']);
        Task::create(['period_id'=>$period->id,'employee_id'=>$andi->id,'weight_id'=>$w2->id,'title'=>'Code Review','target'=>20,'status'=>'in_progress']);
        Task::create(['period_id'=>$period->id,'employee_id'=>$andi->id,'weight_id'=>$w3->id,'title'=>'Dokumentasi API','target'=>10,'status'=>'pending']);

        // ── KPI Weights — Sari, Budi, Dewi ───────
        $w4 = KpiWeight::create(['period_id'=>$period->id,'employee_id'=>$sari->id,'manager_id'=>$manager->id,'category_id'=>$revenue->id,'weight'=>50,'target_value'=>50000000]);
        $w5 = KpiWeight::create(['period_id'=>$period->id,'employee_id'=>$budi->id,'manager_id'=>$manager->id,'category_id'=>$bug->id,   'weight'=>35,'target_value'=>100]);
        $w6 = KpiWeight::create(['period_id'=>$period->id,'employee_id'=>$dewi->id,'manager_id'=>$manager->id,'category_id'=>$csat->id,  'weight'=>30,'target_value'=>4.5]);

        Task::create(['period_id'=>$period->id,'employee_id'=>$sari->id,'weight_id'=>$w4->id,'title'=>'Target Revenue','target'=>50000000,'status'=>'in_progress']);
        Task::create(['period_id'=>$period->id,'employee_id'=>$budi->id,'weight_id'=>$w5->id,'title'=>'Bug Resolution','target'=>100,'status'=>'in_progress']);
        Task::create(['period_id'=>$period->id,'employee_id'=>$dewi->id,'weight_id'=>$w6->id,'title'=>'Kepuasan Pelanggan','target'=>4.5,'status'=>'pending']);
    }
}
