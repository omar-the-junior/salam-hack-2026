<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_user_can_dismiss_onboarding_checklist()
    {
        $user = User::factory()->create([
            'onboarding_completed' => true,
            'onboarding_checklist_dismissed_at' => null,
        ]);

        $this->actingAs($user)
            ->post(route('dashboard.checklist.dismiss'))
            ->assertRedirect(route('dashboard'));

        $this->assertNotNull($user->refresh()->onboarding_checklist_dismissed_at);
    }
}
