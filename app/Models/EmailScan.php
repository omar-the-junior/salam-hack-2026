<?php

namespace App\Models;

use Database\Factories\EmailScanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'status',
    'started_at',
    'completed_at',
    'found_count',
    'error_message',
])]
class EmailScan extends Model
{
    /** @use HasFactory<EmailScanFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    // ─── Relations ──────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(EmailScanResult::class);
    }

    // ─── Helpers ────────────────────────────────────────────────

    public function isRunning(): bool
    {
        return in_array($this->status, ['queued', 'in_progress']);
    }

    public function markInProgress(): void
    {
        $this->update(['status' => 'in_progress', 'started_at' => now()]);
    }

    public function markCompleted(int $foundCount): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
            'found_count' => $foundCount,
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $reason,
        ]);
    }
}
