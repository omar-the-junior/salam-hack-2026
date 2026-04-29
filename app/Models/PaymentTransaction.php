<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'payment_link_id',
        'user_id',
        'paymob_order_id',
        'paymob_transaction_id',
        'amount_cents',
        'currency',
        'status',
        'payment_method',
        'card_last_four',
        'card_brand',
        'gateway_response',
        'failure_reason',
        'hmac_verified',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'gateway_response' => 'array',
            'hmac_verified'    => 'boolean',
            'paid_at'          => 'datetime',
        ];
    }

    public function paymentLink(): BelongsTo
    {
        return $this->belongsTo(PaymentLink::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
