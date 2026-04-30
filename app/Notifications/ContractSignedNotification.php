<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Channels: database + mail
 * Recipient: Freelancer (User)
 * Trigger: Client signs the contract via the public URL (UC-004)
 */
class ContractSignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Contract $contract
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
            'title' => '✍️ عقد موقّع',
            'message' => 'وقّع العميل '.$this->contract->client_name.' على عقد "'.$this->contract->project_name.'"',
            'contract_id' => $this->contract->id,
            'action_url' => route('contracts.show', $this->contract->id),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('✍️ '.$this->contract->client_name.' وقّع على عقدك')
            ->greeting('مرحباً '.($notifiable->display_name ?? $notifiable->name))
            ->line('قام العميل **'.$this->contract->client_name.'** بالتوقيع على عقد المشروع "**'.$this->contract->project_name.'**".')
            ->line('**القيمة الإجمالية:** '.$this->contract->grand_total.' '.$this->contract->currency)
            ->line('**تاريخ التوقيع:** '.$this->contract->signed_at?->format('Y-m-d H:i'))
            ->action('عرض العقد', route('contracts.show', $this->contract->id))
            ->line('شكراً لاستخدامك مُسْتَحَقّ.');
    }
}
