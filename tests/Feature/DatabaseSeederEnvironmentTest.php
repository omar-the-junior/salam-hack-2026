<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederEnvironmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_populates_demo_user_in_non_production_environment(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', [
            'email' => 'demo@example.com',
        ]);
    }

    public function test_database_seeder_skips_demo_user_in_production_environment(): void
    {
        config(['app.env' => 'production']);

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseMissing('users', [
            'email' => 'demo@example.com',
        ]);

        $this->assertSame(0, User::query()->count());
    }
}
