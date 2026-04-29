<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('onboarding.step1', absolute: false));

        $registeredUser = User::query()->where('email', 'test@example.com')->first();
        $this->assertNotNull($registeredUser);
        $this->assertDatabaseHas('user_wallets', [
            'user_id' => $registeredUser->id,
            'currency' => 'EGP',
            'balance_cents' => 0,
        ]);
    }
}
