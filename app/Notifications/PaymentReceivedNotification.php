<?php

namespace App\Notifications;

use App\Models\PaymentTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Channels: database + mail
 * Recipient: Freelancer (User)
 * Trigger: Webhook marks a payment link as Paid (UC-003, UC-005)
 */
class PaymentReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly PaymentTransaction $transaction
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $link = $this->transaction->paymentLink;
        $amountFormatted = number_format($this->transaction->amount_cents / 100, 2).' '.$this->transaction->currency;

        return [
            'title' => '💰 دفعة مستلمة',
            'message' => 'تم استلام '.$amountFormatted.' من '.($link->client_name ?? 'عميل'),
            'transaction_id' => $this->transaction->id,
            'payment_link_id' => $link->id,
            'action_url' => route('payment-links.show', $link->id),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $link = $this->transaction->paymentLink;
        $amountFormatted = number_format($this->transaction->amount_cents / 100, 2).' '.$this->transaction->currency;

        return (new MailMessage)
            ->subject('تم استلام دفعة جديدة — '.$amountFormatted)
            ->greeting('مرحباً '.$notifiable->display_name ?? $notifiable->name)
            ->line('تم استلام دفعة جديدة عبر رابط الدفع الخاص بك.')
            ->line('**المبلغ:** '.$amountFormatted)
            ->line('**العميل:** '.($link->client_name ?? 'غير محدد'))
            ->line('**الوصف:** '.($link->description ?? 'غير محدد'))
            ->line('**تاريخ الدفع:** '.$this->transaction->paid_at?->format('Y-m-d H:i'))
            ->action('عرض التفاصيل', route('payment-links.show', $link->id))
            ->line('شكراً لاستخدامك مُسْتَحَقّ.');
    }
}
