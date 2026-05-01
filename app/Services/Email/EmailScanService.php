<?php

namespace App\Services\Email;

use App\Models\ConnectedAccount;
use App\Models\EmailScan;
use App\Models\EmailScanResult;
use App\Models\User;
use App\Notifications\EmailScanCompletedNotification;
use App\Services\Gmail\GmailScannerService;
use Illuminate\Support\Facades\Log;

class EmailScanService
{
    public function __construct(
        private GmailScannerService $scanner,
        private EmailParserService $parser
    ) {}

    public function run(User $user, EmailScan $scan): EmailScan
    {
        $scan->markInProgress();

        try {
            $account = ConnectedAccount::where('user_id', $user->id)
                ->where('provider', 'gmail')
                ->firstOrFail();

            $emails = $this->scanner->fetchEmails($account, months: 6);

            $found = 0;

            foreach ($emails as $email) {
                if (EmailScanResult::where('raw_email_id', $email['id'])->exists()) {
                    continue;
                }

                $parsed = $this->parser->parse($email);

                if ($parsed === null) {
                    continue;
                }

                EmailScanResult::create([
                    'email_scan_id' => $scan->id,
                    'user_id' => $user->id,
                    ...$parsed,
                ]);

                $found++;
            }

            $scan->markCompleted($found);

            $scan->loadMissing('user');
            $scan->user->notify(new EmailScanCompletedNotification($scan));

            return $scan->fresh() ?? $scan;
        } catch (\Throwable $e) {
            Log::error('EmailScanService failed', [
                'scan_id' => $scan->id,
                'error' => $e->getMessage(),
            ]);

            $scan->markFailed($e->getMessage());

            return $scan->fresh() ?? $scan;
        }
    }
}
