<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserWallet extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'currency',
        'balance_cents',
    ];

    protected function casts(): array
    {
        return [
            'balance_cents' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
