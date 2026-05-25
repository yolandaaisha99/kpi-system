<?php
// ============================================================
// FILE: app/Http/Controllers/EvaluationController.php
// Hitung skor KPI otomatis berdasarkan bobot + progres
// ============================================================

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\KpiWeight;
use App\Models\Task;
use App\Models\TaskProgress;
use App\Models\Period;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google\Cloud\Firestore\FirestoreClient;

class EvaluationController extends Controller
{
    // Manajer: lihat semua evaluasi periode aktif
    public function index(Request $request)
    {
        $periodId = $request->query('period_id');

        $evaluations = Evaluation::with(['employee', 'period'])
            ->when($periodId, fn($q) => $q->where('period_id', $periodId))
            ->orderByDesc('total_score')
            ->get();

        return response()->json(['success' => true, 'data' => $evaluations]);
    }

    // Karyawan: lihat evaluasi diri sendiri
    public function myEvaluation(Request $request)
    {
        $employee = Auth::user();
        $periodId = $request->query('period_id');

        $evaluation = Evaluation::with(['period'])
            ->where('employee_id', $employee->id)
            ->when($periodId, fn($q) => $q->where('period_id', $periodId))
            ->orderByDesc('created_at')
            ->first();

        if (!$evaluation) {
            return response()->json(['success' => true, 'data' => null]);
        }

        return response()->json(['success' => true, 'data' => $evaluation]);
    }

    // Manajer: generate/hitung evaluasi untuk semua karyawan
    public function generate(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:periods,id',
        ]);

        $periodId  = $request->period_id;
        $managerId = Auth::id();

        // Ambil semua karyawan yang punya KPI di periode ini
        $employeeIds = KpiWeight::where('period_id', $periodId)
            ->where('manager_id', $managerId)
            ->distinct()
            ->pluck('employee_id');

        $results = [];

        foreach ($employeeIds as $employeeId) {
            $score = $this->calculateScore($employeeId, $periodId);

            $evaluation = Evaluation::updateOrCreate(
                ['period_id' => $periodId, 'employee_id' => $employeeId],
                [
                    'manager_id'  => $managerId,
                    'total_score' => $score,
                    'status'      => 'draft',
                ]
            );

            $results[] = [
                'employee_id' => $employeeId,
                'score'       => $score,
                'grade'       => $evaluation->grade,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Evaluasi berhasil digenerate untuk ' . count($results) . ' karyawan.',
            'data'    => $results,
        ]);
    }

    // Manajer: approve evaluasi dan kirim notifikasi
    public function approve(Request $request, $id)
    {
        $evaluation = Evaluation::with(['employee', 'period'])->findOrFail($id);
        $evaluation->update([
            'status'      => 'approved',
            'approved_at' => now(),
        ]);

        // Kirim notifikasi ke karyawan via Firestore
        $this->notifyEmployee($evaluation);

        return response()->json([
            'success' => true,
            'message' => 'Evaluasi berhasil disetujui.',
        ]);
    }

    // Hitung skor KPI tertimbang
    // Rumus: Σ (progres_pct × bobot) / 100
    private function calculateScore(int $employeeId, int $periodId): float
    {
        $weights = KpiWeight::where('period_id', $periodId)
            ->where('employee_id', $employeeId)
            ->get();

        if ($weights->isEmpty()) return 0;

        $totalWeight  = $weights->sum('weight');
        $weightedSum  = 0;

        foreach ($weights as $weight) {
            // Ambil progres terakhir untuk task terkait weight ini
            $task = Task::where('period_id', $periodId)
                ->where('employee_id', $employeeId)
                ->where('weight_id', $weight->id)
                ->first();

            if (!$task) continue;

            $latestProgress = TaskProgress::where('task_id', $task->id)
                ->orderByDesc('updated_at')
                ->first();

            $currentValue = $latestProgress?->progress_value ?? 0;
            $progressPct  = $weight->target_value > 0
                ? min(100, ($currentValue / $weight->target_value) * 100)
                : 0;

            // Kontribusi skor = progres% × bobot / total bobot
            $weightedSum += ($progressPct * $weight->weight) / $totalWeight;
        }

        return round($weightedSum, 2);
    }

    // Kirim notifikasi hasil evaluasi ke Firestore
    private function notifyEmployee(Evaluation $evaluation): void
    {
        try {
            $firestore = new FirestoreClient(['projectId' => env('GCP_PROJECT_ID')]);
            $firestore->collection('notifications')->add([
                'recipientId' => $evaluation->employee_id,
                'senderId'    => $evaluation->manager_id,
                'type'        => 'evaluation_done',
                'title'       => 'Hasil Evaluasi KPI Sudah Tersedia!',
                'body'        => "Skor KPI kamu untuk periode {$evaluation->period->name}: {$evaluation->total_score} ({$evaluation->grade}). Tap untuk lihat detail.",
                'data'        => [
                    'evaluationId' => $evaluation->id,
                    'score'        => $evaluation->total_score,
                    'grade'        => $evaluation->grade,
                    'screen'       => 'evaluation_result',
                ],
                'isRead'    => false,
                'readAt'    => null,
                'createdAt' => new \Google\Cloud\Core\Timestamp(new \DateTime()),
            ]);
        } catch (\Exception $e) {
            \Log::error('Firestore notify error: ' . $e->getMessage());
        }
    }
}
