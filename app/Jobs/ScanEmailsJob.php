<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Models\EmailScan;
use App\Models\EmailScanResult;
use App\Services\Email\EmailParserService;
use App\Services\Gmail\GmailScannerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScanEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 300;

    public function __construct(
        private string $userId,
        private string $scanId
    ) {}

    public function handle(
        GmailScannerService $scanner,
        EmailParserService $parser
    ): void {
        $scan = EmailScan::findOrFail($this->scanId);
        $scan->markInProgress();

        try {
            $account = ConnectedAccount::where('user_id', $this->userId)
                ->where('provider', 'gmail')
                ->firstOrFail();

            // 1. Fetch raw emails from Gmail (last 6 months)
            $emails = $scanner->fetchEmails($account, months: 6);

            $found = 0;

            foreach ($emails as $email) {
                // 2. Skip if already stored (idempotent by raw_email_id)
                if (EmailScanResult::where('raw_email_id', $email['id'])->exists()) {
                    continue;
                }

                // 3. Code-based parse
                $parsed = $parser->parse($email);

                if ($parsed === null) {
                    continue;
                }

                // 4. Persist result
                EmailScanResult::create([
                    'email_scan_id' => $this->scanId,
                    'user_id' => $this->userId,
                    ...$parsed,
                ]);

                $found++;
            }

            $scan->markCompleted($found);
        } catch (\Throwable $e) {
            Log::error('ScanEmailsJob failed', [
                'scan_id' => $this->scanId,
                'error' => $e->getMessage(),
            ]);
            $scan->markFailed($e->getMessage());

            throw $e;
        }
    }

    public function failed(\Throwable $e): void
    {
        EmailScan::find($this->scanId)?->markFailed('Job failed after retries: '.$e->getMessage());
    }
}
