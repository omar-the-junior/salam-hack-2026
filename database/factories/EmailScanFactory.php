<?php

namespace Database\Factories;

use App\Models\EmailScan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmailScan>
 */
class EmailScanFactory extends Factory
{
    protected $model = EmailScan::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => 'completed',
            'started_at' => now()->subMinutes(5),
            'completed_at' => now(),
            'found_count' => 0,
            'error_message' => null,
        ];
    }

    public function queued(): static
    {
        return $this->state(['status' => 'queued', 'started_at' => null, 'completed_at' => null]);
    }

    public function inProgress(): static
    {
        return $this->state(['status' => 'in_progress', 'completed_at' => null]);
    }

    public function failed(): static
    {
        return $this->state(['status' => 'failed', 'completed_at' => null, 'error_message' => 'Gmail API error']);
    }
}
