<?php

namespace Database\Factories;

use App\Models\EmailScan;
use App\Models\EmailScanResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmailScanResult>
 */
class EmailScanResultFactory extends Factory
{
    protected $model = EmailScanResult::class;

    public function definition(): array
    {
        return [
            'email_scan_id' => EmailScan::factory(),
            'user_id' => User::factory(),
            'service_name' => fake()->randomElement(['Figma', 'Notion', 'GitHub', 'Adobe', 'Spotify']),
            'amount' => fake()->randomFloat(2, 5, 200),
            'currency' => fake()->randomElement(['USD', 'EGP']),
            'billing_cycle' => fake()->randomElement(['monthly', 'annual', 'one-time', 'unknown']),
            'billing_date' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'confidence' => fake()->randomElement(['high', 'medium', 'low']),
            'raw_email_id' => fake()->unique()->uuid(),
            'raw_email_subject' => 'Your '.fake()->company().' invoice',
            'raw_email_snippet' => fake()->sentence(),
            'status' => 'pending',
        ];
    }

    public function highConfidence(): static
    {
        return $this->state(['confidence' => 'high', 'billing_cycle' => 'monthly']);
    }

    public function approved(): static
    {
        return $this->state(['status' => 'approved']);
    }

    public function rejected(): static
    {
        return $this->state(['status' => 'rejected']);
    }
}
