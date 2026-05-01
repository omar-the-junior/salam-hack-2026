<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Truncates test data and re-creates morph columns as UUID to match
     * the User model's UUID primary key.
     */
    public function up(): void
    {
        DB::table('notifications')->truncate();

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropMorphs('notifiable');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->uuidMorphs('notifiable');
        });
    }

    public function down(): void
    {
        DB::table('notifications')->truncate();

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropMorphs('notifiable');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->morphs('notifiable');
        });
    }
};
