<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unread_notifications_are_shared_with_inertia_props(): void
    {
        $user = User::factory()->create();

        // Insert a fake DB notification directly
        DatabaseNotification::create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\RenewalAlertNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => [
                'title' => '🔔 تجديد قادم',
                'message' => 'Figma Pro يتجدد',
                'action_url' => '/expenses',
            ],
            'read_at' => null,
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('notifications', 1)
            ->where('notifications.0.data.title', '🔔 تجديد قادم')
        );
    }

    public function test_mark_all_read_clears_unread_notifications(): void
    {
        $user = User::factory()->create();

        DatabaseNotification::create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\EmailScanCompletedNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => ['title' => '📧 اكتمل المسح', 'message' => 'تم العثور على اشتراكات'],
            'read_at' => null,
        ]);

        $this->assertDatabaseCount('notifications', 1);

        $response = $this->actingAs($user)->patch(route('notifications.read-all'));

        $response->assertRedirect();
        $this->assertNotNull(DatabaseNotification::first()->read_at);
    }

    public function test_mark_single_notification_read(): void
    {
        $user = User::factory()->create();

        $id = (string) Str::uuid();

        DatabaseNotification::create([
            'id' => $id,
            'type' => 'App\\Notifications\\ContractSignedNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => ['title' => '✍️ عقد موقّع', 'message' => 'وقّع العميل'],
            'read_at' => null,
        ]);

        $response = $this->actingAs($user)->patch(route('notifications.read', $id));

        $response->assertRedirect();
        $this->assertNotNull(DatabaseNotification::find($id)->read_at);
    }

    public function test_guests_cannot_access_notification_routes(): void
    {
        $this->patch(route('notifications.read-all'))->assertRedirectToRoute('login');
    }

    public function test_read_notifications_are_included_in_shared_props(): void
    {
        $user = User::factory()->create();

        DatabaseNotification::create([
            'id' => Str::uuid(),
            'type' => 'App\\Notifications\\RenewalAlertNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => ['title' => '🔔 تجديد قادم', 'message' => 'test'],
            'read_at' => now(), // already read
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page->has('notifications', 1));
    }

    public function test_dashboard_does_not_fail_when_notifications_table_is_missing(): void
    {
        $user = User::factory()->create();

        Schema::dropIfExists('notifications');

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('notifications', 0)
        );
    }
}
