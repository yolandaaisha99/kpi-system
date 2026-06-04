<?php
// ============================================================
// FILE: app/Http/Controllers/ChatController.php
// CRUD Chat Thread — Koleksi Firestore ke-5 (chatThreads)
// Diskusi antara manajer dan karyawan per evaluasi
// ============================================================

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google\Cloud\Firestore\FirestoreClient;

class ChatController extends Controller
{
    private function firestore(): FirestoreClient
    {
        return new FirestoreClient(['projectId' => env('GCP_PROJECT_ID')]);
    }

    // GET /api/chats — ambil semua chat threads milik user
    public function index()
    {
        try {
            $userId   = Auth::id();
            $firestore = $this->firestore();

            $threads = $firestore->collection('chatThreads')
                ->where('participants', 'array-contains', $userId)
                ->orderBy('lastMessageAt', 'DESC')
                ->limit(50)
                ->documents();

            $result = [];
            foreach ($threads as $doc) {
                if ($doc->exists()) {
                    $data = $doc->data();
                    $data['id'] = $doc->id();
                    unset($data['messages']); // jangan kirim semua messages di list
                    $result[] = $data;
                }
            }

            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            \Log::error('Firestore chats error: ' . $e->getMessage());
            return response()->json(['success' => true, 'data' => []]);
        }
    }

    // GET /api/chats/{threadId} — ambil detail thread + messages
    public function show($threadId)
    {
        try {
            $firestore = $this->firestore();
            $doc = $firestore->collection('chatThreads')->document($threadId)->snapshot();

            if (!$doc->exists()) {
                return response()->json(['success' => false, 'message' => 'Thread tidak ditemukan.'], 404);
            }

            $data = $doc->data();
            $data['id'] = $doc->id();

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            \Log::error('Firestore chat show error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal memuat chat.'], 500);
        }
    }

    // POST /api/chats — buat thread baru atau kirim pesan
    public function store(Request $request)
    {
        $request->validate([
            'evaluation_id' => 'required|integer',
            'recipient_id'  => 'required|integer',
            'content'       => 'required|string|max:2000',
        ]);

        try {
            $senderId = Auth::id();
            $firestore = $this->firestore();

            // Cek apakah thread untuk evaluasi ini sudah ada
            $existing = $firestore->collection('chatThreads')
                ->where('evaluationId', '=', $request->evaluation_id)
                ->where('participants', 'array-contains', $senderId)
                ->limit(1)
                ->documents();

            $threadRef = null;
            foreach ($existing as $doc) {
                if ($doc->exists()) {
                    $threadRef = $doc->reference();
                    break;
                }
            }

            $now = new \Google\Cloud\Core\Timestamp(new \DateTime());
            $messageData = [
                'messageId' => 'msg_' . uniqid(),
                'senderId'  => $senderId,
                'content'   => $request->content,
                'sentAt'    => $now,
            ];

            if ($threadRef) {
                // Tambah pesan ke thread yang ada
                $threadRef->update([
                    ['path' => 'messages',      'value' => \Google\Cloud\Firestore\FieldValue::arrayUnion([$messageData])],
                    ['path' => 'lastMessage',   'value' => $request->content],
                    ['path' => 'lastMessageAt', 'value' => $now],
                ]);
            } else {
                // Buat thread baru
                $participants = [$senderId, (int)$request->recipient_id];
                sort($participants);

                $threadRef = $firestore->collection('chatThreads')->add([
                    'evaluationId'  => (int)$request->evaluation_id,
                    'participants'  => $participants,
                    'lastMessage'   => $request->content,
                    'lastMessageAt' => $now,
                    'messages'      => [$messageData],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pesan berhasil dikirim.',
                'data'    => ['threadId' => $threadRef->id()],
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Firestore chat store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengirim pesan.'], 500);
        }
    }
}
