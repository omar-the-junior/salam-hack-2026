<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'expense_card_id',
    'alerted_at',
    'dismissed_at',
])]
class RenewalAlert extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'alerted_at' => 'datetime',
            'dismissed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expenseCard(): BelongsTo
    {
        return $this->belongsTo(ExpenseCard::class);
    }
}
