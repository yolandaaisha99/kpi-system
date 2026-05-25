<?php

namespace App\Http\Controllers;

use App\Models\KpiCategory;
use App\Models\KpiWeight;
use App\Models\Period;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google\Cloud\Firestore\FirestoreClient;

class KpiWeightController extends Controller
{
    /** GET /api/kpi-weights */
    public function index(Request $request)
    {
        $periodId = $request->query('period_id', Period::active()?->id);

        $weights = KpiWeight::with(['employee', 'category', 'period'])
            ->where('manager_id', Auth::id())
            ->when($periodId, fn($q) => $q->where('period_id', $periodId))
            ->orderBy('employee_id')
            ->get();

        return response()->json(['success' => true, 'data' => $weights]);
    }

    /** GET /api/kpi-categories */
    public function categories()
    {
        return response()->json([
            'success' => true,
            'data'    => KpiCategory::where('is_active', true)->get(),
        ]);
    }

    /** POST /api/kpi-weights */
    public function store(Request $request)
    {
        $data = $request->validate([
            'period_id'    => 'required|exists:periods,id',
            'employee_id'  => 'required|exists:users,id',
            'category_id'  => 'required|exists:kpi_categories,id',
            'weight'       => 'required|numeric|min:1|max:100',
            'target_value' => 'required|numeric|min:1',
            'notes'        => 'nullable|string|max:500',
        ]);

        // Validasi total bobot tidak melebihi 100%
        $existingWeight = KpiWeight::where('period_id', $data['period_id'])
            ->where('employee_id', $data['employee_id'])
            ->where('category_id', '!=', $data['category_id'])
            ->sum('weight');

        if ($existingWeight + $data['weight'] > 100) {
            return response()->json([
                'success' => false,
                'message' => "Total bobot akan melebihi 100%. Bobot yang tersisa: " . (100 - $existingWeight) . "%",
            ], 422);
        }

        $weight = KpiWeight::updateOrCreate(
            [
                'period_id'   => $data['period_id'],
                'employee_id' => $data['employee_id'],
                'category_id' => $data['category_id'],
            ],
            [
                'manager_id'   => Auth::id(),
                'weight'       => $data['weight'],
                'target_value' => $data['target_value'],
                'notes'        => $data['notes'],
            ]
        );

        // Buat task otomatis terkait bobot ini
        $category = KpiCategory::find($data['category_id']);
        Task::updateOrCreate(
            ['period_id' => $data['period_id'], 'employee_id' => $data['employee_id'], 'weight_id' => $weight->id],
            ['title' => $category->name, 'target' => $data['target_value'], 'status' => 'pending', 'priority' => 'medium']
        );

        // Kirim notifikasi ke karyawan via Firestore
        $this->notifyEmployee($data['employee_id'], $data['period_id']);

        return response()->json(['success' => true, 'data' => $weight->load(['employee', 'category'])], 201);
    }

    /** PUT /api/kpi-weights/{id} */
    public function update(Request $request, $id)
    {
        $weight = KpiWeight::where('manager_id', Auth::id())->findOrFail($id);

        $data = $request->validate([
            'weight'       => 'sometimes|numeric|min:1|max:100',
            'target_value' => 'sometimes|numeric|min:1',
            'notes'        => 'nullable|string|max:500',
        ]);

        $weight->update($data);
        return response()->json(['success' => true, 'data' => $weight]);
    }

    /** DELETE /api/kpi-weights/{id} */
    public function destroy($id)
    {
        KpiWeight::where('manager_id', Auth::id())->findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Bobot KPI dihapus.']);
    }

    /** GET /api/employees (untuk dropdown modal) */
    public function employees()
    {
        $employees = User::where('role', 'employee')->where('is_active', true)
            ->select('id', 'name', 'department', 'position')->get();
        return response()->json(['success' => true, 'data' => $employees]);
    }

    private function notifyEmployee(int $employeeId, int $periodId): void
    {
        try {
            $period    = Period::find($periodId);
            $firestore = new FirestoreClient(['projectId' => env('GCP_PROJECT_ID')]);
            $firestore->collection('notifications')->add([
                'recipientId' => $employeeId,
                'senderId'    => Auth::id(),
                'type'        => 'kpi_assigned',
                'title'       => 'Bobot KPI Baru Ditetapkan!',
                'body'        => "Manajer kamu sudah menetapkan target KPI untuk periode {$period?->name}. Yuk cek sekarang!",
                'data'        => ['periodId' => $periodId, 'screen' => 'home'],
                'isRead'      => false,
                'readAt'      => null,
                'createdAt'   => new \Google\Cloud\Core\Timestamp(new \DateTime()),
            ]);
        } catch (\Exception $e) {
            \Log::warning('Firestore notify error: ' . $e->getMessage());
        }
    }
}