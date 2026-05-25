<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google\Cloud\Firestore\FirestoreClient;

class NotificationController extends Controller
{
    private function firestore(): FirestoreClient
    {
        return new FirestoreClient(['projectId' => env('GCP_PROJECT_ID')]);
    }

    /**
     * GET /api/notifications
     * Ambil notifikasi dari Firestore milik user yang login
     */
    public function index()
    {
        try {
            $userId     = Auth::id();
            $firestore  = $this->firestore();
            $collection = $firestore->collection('notifications');

            $query = $collection
                ->where('recipientId', '=', $userId)
                ->orderBy('createdAt', 'DESC')
                ->limit(30);

            $docs = $query->documents();
            $notifications = [];

            foreach ($docs as $doc) {
                if ($doc->exists()) {
                    $data = $doc->data();
                    $notifications[] = [
                        'id'        => $doc->id(),
                        'type'      => $data['type'] ?? '',
                        'title'     => $data['title'] ?? '',
                        'body'      => $data['body'] ?? '',
                        'data'      => $data['data'] ?? [],
                        'isRead'    => $data['isRead'] ?? false,
                        'createdAt' => $data['createdAt'] ?? null,
                    ];
                }
            }

            return response()->json(['success' => true, 'data' => $notifications]);
        } catch (\Exception $e) {
            \Log::error('Firestore get notifications: ' . $e->getMessage());
            return response()->json(['success' => true, 'data' => []]);
        }
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Tandai 1 notifikasi sudah dibaca
     */
    public function markRead($id)
    {
        try {
            $this->firestore()->collection('notifications')->document($id)->update([
                ['path' => 'isRead', 'value' => true],
                ['path' => 'readAt', 'value' => new \Google\Cloud\Core\Timestamp(new \DateTime())],
            ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/notifications/read-all
     * Tandai semua notifikasi sudah dibaca
     */
    public function readAll()
    {
        try {
            $userId = Auth::id();
            $docs   = $this->firestore()->collection('notifications')
                ->where('recipientId', '=', $userId)
                ->where('isRead', '=', false)
                ->documents();

            $batch = $this->firestore()->batch();
            foreach ($docs as $doc) {
                if ($doc->exists()) {
                    $batch->update($doc->reference(), [
                        ['path' => 'isRead', 'value' => true],
                        ['path' => 'readAt', 'value' => new \Google\Cloud\Core\Timestamp(new \DateTime())],
                    ]);
                }
            }
            $batch->commit();

            return response()->json(['success' => true, 'message' => 'Semua notifikasi ditandai dibaca.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}