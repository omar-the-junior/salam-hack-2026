<?php

namespace App\Models;

use Database\Factories\ConnectedAccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'provider',
    'email',
    'access_token',
    'refresh_token',
    'token_expires_at',
])]
class ConnectedAccount extends Model
{
    /** @use HasFactory<ConnectedAccountFactory> */
    use HasFactory, HasUuids;

    /**
     * @var list<string>
     */
    protected $hidden = ['access_token', 'refresh_token'];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
        ];
    }

    // ─── Accessors ──────────────────────────────────────────────

    public function getAccessTokenAttribute(string $value): string
    {
        return decrypt($value);
    }

    public function getRefreshTokenAttribute(string $value): string
    {
        return decrypt($value);
    }

    // ─── Mutators ───────────────────────────────────────────────

    public function setAccessTokenAttribute(string $value): void
    {
        $this->attributes['access_token'] = encrypt($value);
    }

    public function setRefreshTokenAttribute(string $value): void
    {
        $this->attributes['refresh_token'] = encrypt($value);
    }

    // ─── Relations ──────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Helpers ────────────────────────────────────────────────

    public function isExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }
}
