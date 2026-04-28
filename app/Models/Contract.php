<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'contract_token',
    'project_name',
    'description',
    'client_name',
    'client_email',
    'total_value',
    'tax_rate',
    'tax_amount',
    'grand_total',
    'currency',
    'start_date',
    'end_date',
    'terms',
    'status',
    'signed_at',
    'client_ip',
])]
class Contract extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'total_value' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'signed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class);
    }
}
