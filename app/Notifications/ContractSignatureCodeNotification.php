<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Channels: mail only
 * Recipient: Client (unauthenticated — notified via email address)
 * Trigger: Freelancer creates a contract (UC-003)
 *
 * Usage: Notification::route('mail', $clientEmail)->notify(new ContractSignatureCodeNotification(...))
 */
class ContractSignatureCodeNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Contract $contract,
        private readonly string $plainCode
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reviewUrl = route('contracts.review', ['token' => $this->contract->contract_token]);

        return (new MailMessage)
            ->subject('رمز التوقيع على عقدك: '.$this->contract->project_name)
            ->greeting('مرحباً '.$this->contract->client_name)
            ->line('أرسل إليك **'.($this->contract->user->display_name ?? $this->contract->user->name).'** عقداً جديداً يحتاج إلى توقيعك.')
            ->line('**المشروع:** '.$this->contract->project_name)
            ->line('**رمز التوقيع الخاص بك:** '.$this->plainCode)
            ->line('احتفظ بهذا الرمز — ستحتاجه لتأكيد هويتك عند قبول العقد.')
            ->action('مراجعة العقد والتوقيع', $reviewUrl)
            ->line('لا تشارك هذا الرمز مع أي شخص آخر.');
    }
}
