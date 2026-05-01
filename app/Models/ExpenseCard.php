<?php

namespace App\Models;

use Database\Factories\ExpenseCardFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'name',
    'category',
    'type',
    'amount',
    'currency',
    'billing_cycle',
    'next_renewal_date',
    'started_at',
    'status',
    'cancel_url',
    'cancel_instructions',
    'notes',
    'alert_days_before',
    'auto_detected',
    'source_email_id',
    'last_alerted_at',
])]
class ExpenseCard extends Model
{
    /** @use HasFactory<ExpenseCardFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'next_renewal_date' => 'date',
            'started_at' => 'date',
            'alert_days_before' => 'integer',
            'auto_detected' => 'boolean',
            'last_alerted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the renewal alerts for the expense card.
     */
    public function renewalAlerts(): HasMany
    {
        return $this->hasMany(RenewalAlert::class);
    }
}
