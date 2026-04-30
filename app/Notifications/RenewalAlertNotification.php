<?php

namespace App\Notifications;

use App\Models\ExpenseCard;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Channels: database + mail
 * Recipient: Freelancer (User)
 * Trigger: Daily cron detects an upcoming expense renewal within the alert window (UC-011)
 */
class RenewalAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly ExpenseCard $expense
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => '🔔 تجديد قادم',
            'message' => $this->expense->name.' يتجدد في '.$this->expense->next_renewal_date->format('Y-m-d').' بمبلغ '.$this->expense->amount.' '.$this->expense->currency,
            'expense_card_id' => $this->expense->id,
            'action_url' => route('expenses.index'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $renewsOn = $this->expense->next_renewal_date->format('Y-m-d');
        $amountFormatted = number_format((float) $this->expense->amount, 2).' '.$this->expense->currency;

        return (new MailMessage)
            ->subject('🔔 تجديد قادم: '.$this->expense->name)
            ->greeting('مرحباً '.($notifiable->display_name ?? $notifiable->name))
            ->line('اشتراكك في **'.$this->expense->name.'** على وشك التجديد.')
            ->line('**تاريخ التجديد:** '.$renewsOn)
            ->line('**المبلغ:** '.$amountFormatted)
            ->when($this->expense->cancel_url, fn (MailMessage $m) => $m->line('**رابط الإلغاء:** '.$this->expense->cancel_url))
            ->action('إدارة المصروفات', route('expenses.index'))
            ->line('شكراً لاستخدامك مُسْتَحَقّ.');
    }
}
