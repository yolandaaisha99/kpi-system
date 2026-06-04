<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\KpiWeight;
use App\Models\Period;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     * Data ringkasan untuk halaman utama manajer
     */
    public function index(Request $request)
    {
        $period = Period::active() ?? Period::latest()->first();

        if (!$period) {
            return response()->json(['success' => false, 'message' => 'Tidak ada periode aktif.'], 404);
        }

        // Semua karyawan aktif yang punya KPI di periode ini
        $employeeIds = KpiWeight::where('period_id', $period->id)
            ->distinct()->pluck('employee_id');

        $totalEmployees = $employeeIds->count();

        // Evaluasi periode ini
        $evaluations = Evaluation::where('period_id', $period->id)
            ->whereIn('employee_id', $employeeIds)->get();

        $avgScore    = $evaluations->avg('total_score') ?? 0;
        $belowTarget = $evaluations->filter(fn($e) => $e->total_score < 60)->count();

        // Karyawan yang tidak update progres > 3 hari
        $cutoff    = now()->subDays(3);
        $notUpdated = Task::where('period_id', $period->id)
            ->whereIn('employee_id', $employeeIds)
            ->where(function ($q) use ($cutoff) {
                $q->whereDoesntHave('progresses')
                  ->orWhereHas('progresses', fn($q2) => $q2->where('updated_at', '<', $cutoff));
            })
            ->distinct('employee_id')
            ->count('employee_id');

        // Data per karyawan untuk tabel
        $employees = User::whereIn('id', $employeeIds)->get()->map(function ($emp) use ($period) {
            $weights     = KpiWeight::with('category')->where('period_id', $period->id)->where('employee_id', $emp->id)->get();
            $mainWeight  = $weights->sortByDesc('weight')->first();
            $evaluation  = Evaluation::where('period_id', $period->id)->where('employee_id', $emp->id)->first();

            $latestTask = Task::where('period_id', $period->id)->where('employee_id', $emp->id)
                ->where('weight_id', $mainWeight?->id)->first();
            $progressPct = $latestTask ? $latestTask->progress_percentage : 0;

            return [
                'id'          => $emp->id,
                'name'        => $emp->name,
                'department'  => $emp->department,
                'position'    => $emp->position,
                'main_kpi'    => $mainWeight?->category?->name ?? '—',
                'weight'      => $mainWeight?->weight ?? 0,
                'progress_pct'=> $progressPct,
                'total_score' => $evaluation?->total_score ?? 0,
                'grade'       => $evaluation?->grade ?? '—',
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'period'    => $period,
                'metrics'   => [
                    'total_employees' => $totalEmployees,
                    'avg_score'       => round($avgScore, 1),
                    'score_change'    => 4, // TODO: bandingkan dengan periode sebelumnya
                    'below_target'    => $belowTarget,
                    'not_updated'     => $notUpdated,
                ],
                'employees' => $employees->values(),
            ],
        ]);
    }
}