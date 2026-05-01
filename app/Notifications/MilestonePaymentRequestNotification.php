<?php

namespace App\Notifications;

use App\Models\Milestone;
use App\Models\PaymentLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Channels: mail only
 * Recipient: Client (unauthenticated — notified via email address)
 * Trigger: Freelancer clicks "Request Payment" on a milestone (UC-005)
 *
 * Usage: Notification::route('mail', $clientEmail)->notify(new MilestonePaymentRequestNotification(...))
 */
class MilestonePaymentRequestNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly PaymentLink $paymentLink,
        private readonly Milestone $milestone
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        // Client is not a User — delivered by email only; no DB notification.
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $contract = $this->milestone->contract;
        $amountFormatted = number_format((float) $this->paymentLink->total_amount, 2).' '.$this->paymentLink->currency;
        $payUrl = route('pay.show', $this->paymentLink->public_token);

        return (new MailMessage)
            ->subject('طلب دفع: '.$this->milestone->title.' — '.$contract->project_name)
            ->greeting('مرحباً '.($this->paymentLink->client_name ?? 'عزيزي العميل'))
            ->line('يود **'.$contract->user->name.'** تحصيل دفعة المرحلة التالية:')
            ->line('**المشروع:** '.$contract->project_name)
            ->line('**المرحلة:** '.$this->milestone->title)
            ->line('**المبلغ المستحق:** '.$amountFormatted)
            ->when($this->paymentLink->due_date, fn (MailMessage $m) => $m->line('**تاريخ الاستحقاق:** '.$this->paymentLink->due_date->format('Y-m-d')))
            ->action('ادفع الآن', $payUrl)
            ->line('شكراً لك على تعاملك.');
    }
}
