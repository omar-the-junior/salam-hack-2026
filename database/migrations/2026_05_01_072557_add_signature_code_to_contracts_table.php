<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('signature_code_hash')->nullable()->after('client_ip');
            $table->timestamp('signature_code_sent_at')->nullable()->after('signature_code_hash');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['signature_code_hash', 'signature_code_sent_at']);
        });
    }
};
