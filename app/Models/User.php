<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;

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

    protected static function booted(): void
    {
        static::created(function (User $user): void {
            if (! Schema::hasTable('user_wallets')) {
                return;
            }

            $currency = $user->preferred_currency ?: 'EGP';

            $user->wallets()->firstOrCreate(
                ['currency' => $currency],
                ['balance_cents' => 0],
            );
        });
    }

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

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function wallets(): HasMany
    {
        return $this->hasMany(UserWallet::class);
    }

    public function incomeEntries(): HasMany
    {
        return $this->hasMany(IncomeEntry::class);
    }

    public function expenseCards(): HasMany
    {
        return $this->hasMany(ExpenseCard::class);
    }

    public function connectedAccounts(): HasMany
    {
        return $this->hasMany(ConnectedAccount::class);
    }

    public function gmailAccount(): HasOne
    {
        return $this->hasOne(ConnectedAccount::class)->where('provider', 'gmail');
    }

    public function emailScans(): HasMany
    {
        return $this->hasMany(EmailScan::class);
    }

    public function latestScan(): HasOne
    {
        return $this->hasOne(EmailScan::class)->latestOfMany('created_at');
    }
}
