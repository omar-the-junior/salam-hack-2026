<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'password',
    'provider_id',
    'avatar_url',
    'display_name',
    'role',
    'country',
    'preferred_currency',
    'profession',
    'default_tax_rate',
    'onboarding_completed',
    'onboarding_checklist_dismissed_at',
])]
#[Hidden(['password', 'remember_token', 'provider_id'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_completed' => 'boolean',
            'default_tax_rate' => 'decimal:2',
            'onboarding_checklist_dismissed_at' => 'datetime',
        ];
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
