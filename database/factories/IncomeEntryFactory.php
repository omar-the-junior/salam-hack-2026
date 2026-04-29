<?php

namespace Database\Factories;

use App\Models\IncomeEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncomeEntry>
 */
class IncomeEntryFactory extends Factory
{
    protected $model = IncomeEntry::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'amount' => fake()->randomFloat(2, 50, 5000),
            'currency' => 'EGP',
            'date' => fake()->date(),
            'source' => 'manual',
            'source_label' => 'Other',
            'client_name' => fake()->optional()->name(),
            'category' => 'Freelance',
            'description' => fake()->optional()->sentence(),
            'reference_id' => null,
        ];
    }
}
