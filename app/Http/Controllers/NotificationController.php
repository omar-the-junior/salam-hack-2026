<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, string $id): RedirectResponse
    {
        if (! Schema::hasTable('notifications')) {
            return back();
        }

        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return back();
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllRead(Request $request): RedirectResponse
    {
        if (! Schema::hasTable('notifications')) {
            return back();
        }

        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
