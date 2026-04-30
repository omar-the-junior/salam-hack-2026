<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_scan_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('email_scan_id')->constrained('email_scans')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('service_name')->nullable();
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('currency', 10)->nullable();
            $table->enum('billing_cycle', ['monthly', 'annual', 'one-time', 'unknown'])
                ->default('unknown');
            $table->date('billing_date')->nullable();
            $table->enum('confidence', ['high', 'medium', 'low'])->default('low');
            $table->string('raw_email_id')->unique();
            $table->string('raw_email_subject')->nullable();
            $table->text('raw_email_snippet')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->dateTime('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_scan_results');
    }
};
