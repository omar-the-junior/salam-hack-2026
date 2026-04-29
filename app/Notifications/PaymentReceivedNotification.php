<?php

namespace App\Notifications;

use App\Models\PaymentTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly PaymentTransaction $transaction
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $link        = $this->transaction->paymentLink;
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
