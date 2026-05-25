<?php
// ============================================================
// FILE: app/Http/Controllers/TaskProgressController.php
// Mengelola update progres task oleh karyawan
// ============================================================

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskProgress;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Google\Cloud\Firestore\FirestoreClient;

class TaskProgressController extends Controller
{
    // Ambil semua task milik karyawan yang login
    public function myTasks(Request $request)
    {
        $employee = Auth::user();
        $periodId = $request->query('period_id');

        $tasks = Task::with(['kpiWeight.category'])
            ->where('employee_id', $employee->id)
            ->when($periodId, fn($q) => $q->where('period_id', $periodId))
            ->get()
            ->map(function ($task) {
                $latestProgress = TaskProgress::where('task_id', $task->id)
                    ->orderByDesc('updated_at')
                    ->first();

                $currentValue = $latestProgress?->progress_value ?? 0;
                $percentage   = $task->target > 0
                    ? min(100, round(($currentValue / $task->target) * 100, 1))
                    : 0;

                return [
                    'id'            => $task->id,
                    'title'         => $task->title,
                    'description'   => $task->description,
                    'target'        => $task->target,
                    'current_value' => $currentValue,
                    'percentage'    => $percentage,
                    'deadline'      => $task->deadline,
                    'priority'      => $task->priority,
                    'status'        => $task->status,
                    'weight'        => $task->kpiWeight->weight,
                    'category'      => $task->kpiWeight->category->name,
                    'unit'          => $task->kpiWeight->category->unit,
                    'last_updated'  => $latestProgress?->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $tasks,
        ]);
    }

    // Karyawan simpan update progres
    public function store(Request $request)
    {
        $request->validate([
            'task_id'        => 'required|exists:tasks,id',
            'progress_value' => 'required|numeric|min:0',
            'notes'          => 'nullable|string|max:500',
            'evidence'       => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf,webp',
        ]);

        $employee = Auth::user();
        $task     = Task::findOrFail($request->task_id);

        // Pastikan task milik karyawan ini
        if ($task->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $evidenceUrl = null;

        // Upload bukti ke Cloud Storage
        if ($request->hasFile('evidence')) {
            $file        = $request->file('evidence');
            $path        = "evidence/{$employee->id}/{$task->id}/" . now()->format('Ymd_His') . '.' . $file->extension();
            $evidenceUrl = Storage::disk('gcs')->put($path, $file);
            $evidenceUrl = Storage::disk('gcs')->url($path);
        }

        // Simpan progres ke Cloud SQL
        $progress = TaskProgress::create([
            'task_id'        => $task->id,
            'employee_id'    => $employee->id,
            'progress_value' => $request->progress_value,
            'notes'          => $request->notes,
            'evidence_url'   => $evidenceUrl,
        ]);

        // Update status task
        $percentage = ($request->progress_value / $task->target) * 100;
        if ($percentage >= 100) {
            $task->update(['status' => 'completed']);
        } elseif ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        // Simpan activity log ke Firestore
        $this->logToFirestore($employee, $task, $progress, $request->progress_value);

        // Kirim notifikasi ke Firestore jika progres rendah
        if ($percentage < 50 && now()->day > 20) {
            $this->sendLowProgressNotification($employee, $task, $percentage);
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Progres berhasil diupdate!',
            'data'       => $progress,
            'percentage' => round($percentage, 1),
        ], 201);
    }

    // Riwayat update progres untuk 1 task
    public function history($taskId)
    {
        $employee = Auth::user();

        $history = TaskProgress::where('task_id', $taskId)
            ->where('employee_id', $employee->id)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(['success' => true, 'data' => $history]);
    }

    // Simpan log aktivitas ke Firestore
    private function logToFirestore(User $employee, Task $task, TaskProgress $progress, $newValue): void
    {
        try {
            $firestore  = new FirestoreClient(['projectId' => env('GCP_PROJECT_ID')]);
            $collection = $firestore->collection('activityLogs');

            $previousProgress = TaskProgress::where('task_id', $task->id)
                ->where('employee_id', $employee->id)
                ->orderByDesc('updated_at')
                ->skip(1)
                ->first();

            $collection->add([
                'userId'     => $employee->id,
                'employeeId' => $employee->id,
                'periodId'   => $task->period_id,
                'action'     => 'progress_update',
                'detail'     => [
                    'taskId'        => $task->id,
                    'taskTitle'     => $task->title,
                    'previousValue' => $previousProgress?->progress_value ?? 0,
                    'newValue'      => $newValue,
                ],
                'timestamp' => new \Google\Cloud\Core\Timestamp(new \DateTime()),
            ]);
        } catch (\Exception $e) {
            \Log::error('Firestore log error: ' . $e->getMessage());
        }
    }

    // Kirim notifikasi progres rendah ke Firestore
    private function sendLowProgressNotification(User $employee, Task $task, float $percentage): void
    {
        try {
            $firestore  = new FirestoreClient(['projectId' => env('GCP_PROJECT_ID')]);
            $collection = $firestore->collection('notifications');

            $collection->add([
                'recipientId' => $employee->id,
                'senderId'    => null,
                'type'        => 'progress_low',
                'title'       => 'Progres Masih Rendah',
                'body'        => "Progres '{$task->title}' kamu baru {$percentage}%. Deadline sudah dekat!",
                'data'        => [
                    'taskId' => $task->id,
                    'screen' => 'task_detail',
                ],
                'isRead'    => false,
                'readAt'    => null,
                'createdAt' => new \Google\Cloud\Core\Timestamp(new \DateTime()),
            ]);
        } catch (\Exception $e) {
            \Log::error('Firestore notification error: ' . $e->getMessage());
        }
    }
}
