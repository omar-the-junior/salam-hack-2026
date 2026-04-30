<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class NotificationController extends Controller
{
    public function markRead(Request $request, string $id): RedirectResponse
    {
        try {
            if (! Schema::hasTable('notifications')) {
                return back();
            }

            Log::info('Marking notification as read', [
                'user_id' => $request->user()?->id,
                'notification_id' => $id,
            ]);

            $notification = $request->user()
                ->notifications()
                ->findOrFail($id);

            $notification->markAsRead();

            return back();
        } catch (Throwable $e) {
            Log::error(static::class.'@markRead', [
                'user_id' => auth()->id(),
                'notification_id' => $id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        try {
            if (! Schema::hasTable('notifications')) {
                return back();
            }

            Log::info('Marking all notifications as read', [
                'user_id' => $request->user()?->id,
            ]);

            $request->user()->unreadNotifications->markAsRead();

            return back();
        } catch (Throwable $e) {
            Log::error(static::class.'@markAllRead', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
