<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login — menghasilkan token Sanctum
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)
                    ->where('is_active', true)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Hapus token lama agar tidak menumpuk
        $user->tokens()->delete();

        // Buat token baru dengan ability sesuai role
        $abilities = $user->isManager()
            ? ['manager:all']
            : ['employee:progress', 'employee:view'];

        $token = $user->createToken('kpi-token', $abilities)->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'department' => $user->department,
                'position'   => $user->position,
                'avatar_url' => $user->avatar_url,
            ],
        ]);
    }

    /**
     * Logout — hapus semua token user
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout.',
        ]);
    }

    /**
     * Me — data user yang sedang login
     * GET /api/auth/me
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'department' => $user->department,
                'position'   => $user->position,
                'avatar_url' => $user->avatar_url,
                'is_active'  => $user->is_active,
            ],
        ]);
    }

    /**
     * Refresh token (opsional)
     * POST /api/auth/refresh
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();

        $abilities = $user->isManager()
            ? ['manager:all']
            : ['employee:progress', 'employee:view'];

        $token = $user->createToken('kpi-token', $abilities)->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
        ]);
    }
}