<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('income_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->date('date');
            $table->enum('source', ['payment_link', 'manual', 'email_parsed']);
            $table->string('source_label')->nullable();
            $table->string('client_name')->nullable();
            $table->string('category');
            $table->text('description')->nullable();
            $table->string('reference_id')->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('income_entries');
    }
};
