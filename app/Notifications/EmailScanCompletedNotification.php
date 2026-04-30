<?php

namespace App\Notifications;

use App\Models\EmailScan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Channels: database only (no email per UC-015 matrix)
 * Recipient: Freelancer (User)
 * Trigger: ScanEmailsJob finishes successfully (UC-009)
 */
class EmailScanCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly EmailScan $scan
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $count = $this->scan->found_count ?? 0;

        return [
            'title' => '📧 اكتمل مسح البريد',
            'message' => 'تم اكتمال مسح البريد الإلكتروني. '.($count > 0 ? 'تم العثور على '.$count.' اشتراك.' : 'لم يتم العثور على اشتراكات جديدة.'),
            'scan_id' => $this->scan->id,
            'found_count' => $count,
            'action_url' => route('email-scanner.index'),
        ];
    }
}
