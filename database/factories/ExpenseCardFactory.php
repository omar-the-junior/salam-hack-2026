<?php

namespace Database\Factories;

use App\Models\ExpenseCard;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExpenseCard>
 */
class ExpenseCardFactory extends Factory
{
    protected $model = ExpenseCard::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['recurring', 'one-time']);
        $billingCycle = $type === 'one-time'
            ? 'one-time'
            : fake()->randomElement(['monthly', 'annual']);

        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'category' => fake()->randomElement(['saas', 'tool', 'equipment', 'marketing', 'other']),
            'type' => $type,
            'amount' => fake()->randomFloat(2, 10, 500),
            'currency' => fake()->randomElement(['EGP', 'USD']),
            'billing_cycle' => $billingCycle,
            'next_renewal_date' => $type === 'recurring' ? fake()->dateTimeBetween('+1 week', '+1 year')->format('Y-m-d') : null,
            'started_at' => fake()->optional()->date(),
            'status' => 'active',
            'cancel_url' => fake()->optional()->url(),
            'cancel_instructions' => null,
            'notes' => fake()->optional()->sentence(),
            'alert_days_before' => 7,
            'auto_detected' => false,
            'source_email_id' => null,
            'last_alerted_at' => null,
        ];
    }
}
