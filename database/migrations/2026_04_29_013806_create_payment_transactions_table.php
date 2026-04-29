<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('payment_link_id')
                ->constrained('payment_links')
                ->cascadeOnDelete();

            // user_id = the freelancer who owns the link, never the payer
            $table->foreignUuid('user_id')
                ->constrained('users');

            $table->string('paymob_order_id')->nullable()->index();
            $table->string('paymob_transaction_id')->nullable()->unique()->index();

            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3);

            // pending | paid | failed
            $table->string('status', 20)->default('pending')->index();
            $table->string('payment_method', 30)->default('card');

            $table->string('card_last_four', 4)->nullable();
            $table->string('card_brand', 20)->nullable();

            $table->json('gateway_response')->nullable();
            $table->string('failure_reason')->nullable();
            $table->boolean('hmac_verified')->default(false);
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
