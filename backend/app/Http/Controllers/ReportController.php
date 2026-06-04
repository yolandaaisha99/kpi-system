<?php
// ============================================================
// FILE: app/Http/Controllers/ReportController.php
// CRUD Laporan Ringkasan per Periode (Manajer)
// ============================================================

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Evaluation;
use App\Models\Period;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    // GET /api/reports — daftar semua laporan
    public function index(Request $request)
    {
        $periodId = $request->query('period_id');

        $reports = Report::with(['period', 'manager', 'topPerformer', 'lowestPerformer'])
            ->when($periodId, fn($q) => $q->where('period_id', $periodId))
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $reports]);
    }

    // POST /api/reports/generate — generate laporan dari evaluasi
    public function generate(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:periods,id',
        ]);

        $periodId  = $request->period_id;
        $managerId = Auth::id();
        $period    = Period::findOrFail($periodId);

        // Ambil evaluasi untuk periode ini
        $evaluations = Evaluation::where('period_id', $periodId)->get();

        if ($evaluations->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada evaluasi untuk periode ini. Generate evaluasi terlebih dahulu.',
            ], 422);
        }

        $avgScore   = round($evaluations->avg('total_score'), 2);
        $topPerf    = $evaluations->sortByDesc('total_score')->first();
        $lowestPerf = $evaluations->sortBy('total_score')->first();

        $report = Report::updateOrCreate(
            ['period_id' => $periodId, 'manager_id' => $managerId],
            [
                'title'               => "Laporan Evaluasi KPI — {$period->name}",
                'summary'             => "Evaluasi KPI untuk {$evaluations->count()} karyawan pada periode {$period->name}. Rata-rata skor: {$avgScore}.",
                'avg_score'           => $avgScore,
                'top_performer_id'    => $topPerf->employee_id,
                'lowest_performer_id' => $lowestPerf->employee_id,
                'total_employees'     => $evaluations->count(),
                'published_at'        => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil digenerate.',
            'data'    => $report->load(['period', 'topPerformer', 'lowestPerformer']),
        ], 201);
    }

    // GET /api/reports/{id} — detail laporan
    public function show($id)
    {
        $report = Report::with(['period', 'manager', 'topPerformer', 'lowestPerformer'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $report]);
    }

    // DELETE /api/reports/{id} — hapus laporan
    public function destroy($id)
    {
        $report = Report::findOrFail($id);
        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dihapus.',
        ]);
    }
}
