<?php

namespace Tests\Feature;

use App\Models\IncomeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncomeExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_income_csv_export(): void
    {
        $response = $this->get(route('income.export.csv'));

        $response->assertRedirect(route('login'));
    }

    public function test_guest_is_redirected_from_income_excel_export(): void
    {
        $response = $this->get(route('income.export.excel'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_download_csv_export(): void
    {
        $freelancer = User::factory()->create(['email' => 'income-export-csv@example.com']);

        IncomeEntry::factory()->create([
            'user_id' => $freelancer->id,
            'amount' => '250.00',
            'currency' => 'EGP',
            'date' => '2026-04-15',
            'source' => 'manual',
            'source_label' => 'Other',
            'client_name' => 'Acme Ltd',
            'category' => 'Freelance',
            'description' => 'Project fee',
        ]);

        $response = $this->actingAs($freelancer)->get(route('income.export.csv', [
            'month' => '2026-04',
            'source' => 'all',
            'category' => 'all',
            'search' => '',
        ]));

        $response->assertOk();
        $response->assertDownload('income-2026-04.csv');

        $file = $response->baseResponse->getFile();
        $this->assertNotNull($file);
        $content = (string) file_get_contents($file->getRealPath());

        $this->assertStringContainsString('"Date"', $content);
        $this->assertStringContainsString('"Amount"', $content);
        $this->assertStringContainsString('"Currency"', $content);
        $this->assertStringContainsString('2026-04-15', $content);
        $this->assertMatchesRegularExpression('/"?250(\.00)?"?/', $content);
        $this->assertStringContainsString('Acme Ltd', $content);
        $this->assertStringContainsString('Freelance', $content);
    }

    public function test_authenticated_user_can_download_excel_export(): void
    {
        $freelancer = User::factory()->create(['email' => 'income-export-xlsx@example.com']);

        IncomeEntry::factory()->create([
            'user_id' => $freelancer->id,
            'amount' => '99.50',
            'currency' => 'USD',
            'date' => '2026-05-01',
            'source' => 'manual',
            'category' => 'Other',
        ]);

        $response = $this->actingAs($freelancer)->get(route('income.export.excel', [
            'month' => '2026-05',
        ]));

        $response->assertOk();
        $response->assertDownload('income-2026-05.xlsx');
    }

    public function test_export_excludes_other_users_income(): void
    {
        $owner = User::factory()->create(['email' => 'income-owner-export@example.com']);
        $other = User::factory()->create(['email' => 'income-stranger-export@example.com']);

        IncomeEntry::factory()->create([
            'user_id' => $other->id,
            'amount' => '500.00',
            'currency' => 'EGP',
            'date' => '2026-04-10',
            'source' => 'manual',
            'client_name' => 'Secret Client Co',
            'category' => 'Freelance',
        ]);

        IncomeEntry::factory()->create([
            'user_id' => $owner->id,
            'amount' => '100.00',
            'currency' => 'EGP',
            'date' => '2026-04-11',
            'source' => 'manual',
            'client_name' => 'Visible Client',
            'category' => 'Freelance',
        ]);

        $response = $this->actingAs($owner)->get(route('income.export.csv', [
            'month' => '2026-04',
        ]));

        $response->assertOk();

        $file = $response->baseResponse->getFile();
        $this->assertNotNull($file);
        $content = (string) file_get_contents($file->getRealPath());

        $this->assertStringContainsString('Visible Client', $content);
        $this->assertStringNotContainsString('Secret Client Co', $content);
    }

    public function test_export_respects_month_source_category_and_search_filters(): void
    {
        $user = User::factory()->create(['email' => 'income-filter-export@example.com']);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '10.00',
            'currency' => 'EGP',
            'date' => '2026-03-30',
            'source' => 'manual',
            'category' => 'Freelance',
            'description' => 'March row',
        ]);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '20.00',
            'currency' => 'EGP',
            'date' => '2026-04-01',
            'source' => 'manual',
            'category' => 'Freelance',
            'description' => 'UniqueAlphaKeyword',
        ]);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '30.00',
            'currency' => 'EGP',
            'date' => '2026-04-02',
            'source' => 'payment_link',
            'category' => 'Freelance',
            'description' => 'payment row',
        ]);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '40.00',
            'currency' => 'EGP',
            'date' => '2026-04-03',
            'source' => 'manual',
            'category' => 'Consulting',
            'description' => 'consulting row',
        ]);

        $response = $this->actingAs($user)->get(route('income.export.csv', [
            'month' => '2026-04',
            'source' => 'manual',
            'category' => 'freelance',
            'search' => 'UniqueAlpha',
        ]));

        $response->assertOk();

        $file = $response->baseResponse->getFile();
        $this->assertNotNull($file);
        $content = (string) file_get_contents($file->getRealPath());

        $this->assertStringContainsString('UniqueAlphaKeyword', $content);
        $this->assertStringNotContainsString('March row', $content);
        $this->assertStringNotContainsString('payment row', $content);
        $this->assertStringNotContainsString('consulting row', $content);
    }

    public function test_export_redirects_with_flash_when_no_matching_rows(): void
    {
        $user = User::factory()->create(['email' => 'income-empty-export@example.com']);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '50.00',
            'currency' => 'EGP',
            'date' => '2026-06-01',
            'source' => 'manual',
            'category' => 'Freelance',
        ]);

        $response = $this->actingAs($user)
            ->from(route('income.index'))
            ->get(route('income.export.csv', [
                'month' => '2026-07',
            ]));

        $response->assertRedirect(route('income.index'));
        $response->assertSessionHas('flash.type', 'error');
        $response->assertSessionHas('flash.message');
    }
}
