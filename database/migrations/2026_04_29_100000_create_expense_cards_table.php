<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('category', ['saas', 'tool', 'equipment', 'marketing', 'other']);
            $table->enum('type', ['recurring', 'one-time']);
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->enum('billing_cycle', ['monthly', 'annual', 'one-time']);
            $table->date('next_renewal_date')->nullable();
            $table->date('started_at')->nullable();
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->string('cancel_url')->nullable();
            $table->text('cancel_instructions')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('alert_days_before')->default(7);
            $table->boolean('auto_detected')->default(false);
            $table->string('source_email_id')->nullable();
            $table->timestamp('last_alerted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_cards');
    }
};
