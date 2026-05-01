<?php

namespace App\Http\Controllers;

use App\Models\RenewalAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class RenewalAlertController extends Controller
{
    public function dismiss(RenewalAlert $renewalAlert): RedirectResponse
    {
        try {
            abort_unless($renewalAlert->user_id === auth()->id(), 403);

            $renewalAlert->update(['dismissed_at' => now()]);

            return back();
        } catch (Throwable $e) {
            Log::error(static::class.'@dismiss', [
                'user_id' => auth()->id(),
                'renewal_alert_id' => $renewalAlert->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
