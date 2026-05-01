<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (config('app.env') === 'production') {
            return;
        }

        $this->call([
            DemoUserSeeder::class,
        ]);
    }
}
