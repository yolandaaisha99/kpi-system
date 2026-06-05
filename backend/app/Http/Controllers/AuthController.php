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
     * Register — membuat akun baru (otomatis employee)
     * POST /api/auth/register
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'username' => 'required|string|max:50|unique:users',
            'email'    => 'nullable|email|max:150|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'      => $request->name,
            'username'  => $request->username,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => 'employee',
            'is_active' => true,
        ]);

        $abilities = ['employee:progress', 'employee:view'];
        $token = $user->createToken('kpi-token', $abilities)->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'username'   => $user->username,
                'email'      => $user->email,
                'role'       => $user->role,
                'department' => $user->department,
                'position'   => $user->position,
                'avatar_url' => $user->avatar_url,
            ],
        ], 201);
    }

    /**
     * Login — menghasilkan token Sanctum
     * POST /api/auth/login
     * Mendukung login via username ATAU email
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Cari user berdasarkan username ATAU email
        $user = User::where('is_active', true)
                    ->where(function ($query) use ($request) {
                        $query->where('username', $request->username)
                              ->orWhere('email', $request->username);
                    })
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
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
                'username'   => $user->username,
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
                'username'   => $user->username,
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
     * Refresh token
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

    /**
     * Setup Manager — route untuk membuat manager pertama
     * POST /api/setup-manager
     */
    public function setupManager(Request $request)
    {
        if (User::where('role', 'manager')->exists()) {
            return response()->json(['message' => 'Manager already exists'], 400);
        }

        $request->validate([
            'name'     => 'required|string',
            'username' => 'required|string|unique:users',
            'password' => 'required|string',
        ]);

        $user = User::create([
            'name'      => $request->name,
            'username'  => $request->username,
            'email'     => $request->username . '@kpi.app',
            'password'  => Hash::make($request->password),
            'role'      => 'manager',
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Manager created', 'user' => $user]);
    }
}