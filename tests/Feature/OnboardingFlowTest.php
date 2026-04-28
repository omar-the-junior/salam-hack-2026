<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_is_stored_in_session_on_step1_and_persisted_on_step2()
    {
        $user = User::factory()->create([
            'onboarding_completed' => false,
            'role' => null,
        ]);

        $this->actingAs($user)
            ->post(route('onboarding.step1.store'), [
                'role' => 'Freelancer',
            ])
            ->assertRedirect(route('onboarding.step2'));

        $user->refresh();
        $this->assertNull($user->role);

        $this->actingAs($user)
            ->withSession(['onboarding.role' => 'freelancer'])
            ->post(route('onboarding.step2.store'), [
                'display_name' => 'Test Display',
                'country' => 'Egypt',
                'preferred_currency' => 'EGP',
                'profession' => 'Developer',
            ])
            ->assertRedirect(route('dashboard'));

        $user->refresh();
        $this->assertSame('freelancer', $user->role);
        $this->assertTrue($user->onboarding_completed);
        $this->assertSame('Test Display', $user->display_name);
    }

    public function test_incomplete_user_is_redirected_to_onboarding_step1()
    {
        $user = User::factory()->create([
            'onboarding_completed' => false,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('onboarding.step1'));
    }
}
