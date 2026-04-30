<?php

namespace App\Models;

use Database\Factories\EmailScanResultFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'email_scan_id',
    'user_id',
    'service_name',
    'amount',
    'currency',
    'billing_cycle',
    'billing_date',
    'confidence',
    'raw_email_id',
    'raw_email_subject',
    'raw_email_snippet',
    'status',
])]
class EmailScanResult extends Model
{
    /** @use HasFactory<EmailScanResultFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'billing_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    // ─── Relations ──────────────────────────────────────────────

    public function scan(): BelongsTo
    {
        return $this->belongsTo(EmailScan::class, 'email_scan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ─────────────────────────────────────────────────

    /**
     * @param  Builder<EmailScanResult>  $query
     * @return Builder<EmailScanResult>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * @param  Builder<EmailScanResult>  $query
     * @return Builder<EmailScanResult>
     */
    public function scopeHighConfidence(Builder $query): Builder
    {
        return $query->where('confidence', 'high');
    }
}
