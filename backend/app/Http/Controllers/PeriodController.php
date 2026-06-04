<?php
// ============================================================
// FILE: app/Http/Controllers/PeriodController.php
// CRUD Periode Evaluasi (Manajer)
// ============================================================

namespace App\Http\Controllers;

use App\Models\Period;
use Illuminate\Http\Request;

class PeriodController extends Controller
{
    // GET /api/periods — daftar semua periode
    public function index()
    {
        $periods = Period::orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        return response()->json(['success' => true, 'data' => $periods]);
    }

    // POST /api/periods — buat periode baru
    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:50',
            'year'       => 'required|integer|min:2020|max:2099',
            'month'      => 'required|integer|min:1|max:12',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
        ]);

        // Pastikan kombinasi year+month unik
        $exists = Period::where('year', $request->year)
            ->where('month', $request->month)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Periode untuk bulan dan tahun tersebut sudah ada.',
            ], 422);
        }

        $period = Period::create($request->only([
            'name', 'year', 'month', 'start_date', 'end_date',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Periode berhasil dibuat.',
            'data'    => $period,
        ], 201);
    }

    // PUT /api/periods/{id} — update periode
    public function update(Request $request, $id)
    {
        $period = Period::findOrFail($id);

        $request->validate([
            'name'       => 'sometimes|string|max:50',
            'start_date' => 'sometimes|date',
            'end_date'   => 'sometimes|date',
            'is_active'  => 'sometimes|boolean',
        ]);

        // Jika mengaktifkan periode, nonaktifkan yang lain
        if ($request->is_active) {
            Period::where('id', '!=', $id)->update(['is_active' => false]);
        }

        $period->update($request->only([
            'name', 'start_date', 'end_date', 'is_active',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Periode berhasil diperbarui.',
            'data'    => $period->fresh(),
        ]);
    }

    // DELETE /api/periods/{id} — hapus periode
    public function destroy($id)
    {
        $period = Period::findOrFail($id);

        if ($period->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus periode yang sedang aktif.',
            ], 422);
        }

        $period->delete();

        return response()->json([
            'success' => true,
            'message' => 'Periode berhasil dihapus.',
        ]);
    }
}
