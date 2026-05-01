<?php

namespace App\Http\Requests\ExpenseCards;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(['saas', 'tool', 'equipment', 'marketing', 'other'])],
            'type' => ['required', 'string', Rule::in(['recurring', 'one-time'])],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'currency' => ['required', 'string', Rule::in(['EGP', 'USD'])],
            'billing_cycle' => ['required', 'string', Rule::in(['monthly', 'annual', 'one-time'])],
            'next_renewal_date' => ['nullable', 'date'],
            'started_at' => ['nullable', 'date'],
            'cancel_url' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'alert_days_before' => ['nullable', 'integer', 'min:0', 'max:365'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['started_at', 'next_renewal_date'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->input('notes') === '') {
            $this->merge(['notes' => null]);
        }

        $cancelUrl = $this->input('cancel_url');
        if ($cancelUrl === '') {
            $this->merge(['cancel_url' => null]);
        }

        $type = $this->input('type');

        if ($type === 'one-time') {
            $this->merge([
                'billing_cycle' => 'one-time',
                'next_renewal_date' => null,
            ]);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $data = $validator->getData();
            if (($data['type'] ?? '') === 'recurring') {
                if (empty($data['next_renewal_date'])) {
                    $validator->errors()->add('next_renewal_date', 'تاريخ التجديد مطلوب للمصاريف المتكررة.');
                }
                $cycle = $data['billing_cycle'] ?? '';
                if (! in_array($cycle, ['monthly', 'annual'], true)) {
                    $validator->errors()->add('billing_cycle', 'دورة الفوترة يجب أن تكون شهرية أو سنوية للمصاريف المتكررة.');
                }
            }

            $startedAt = $data['started_at'] ?? null;
            $nextRenewal = $data['next_renewal_date'] ?? null;
            if ($startedAt !== null && $startedAt !== '' && $nextRenewal !== null && $nextRenewal !== '') {
                if (strtotime((string) $nextRenewal) < strtotime((string) $startedAt)) {
                    $validator->errors()->add(
                        'next_renewal_date',
                        'تاريخ التجديد القادم يجب ألا يكون قبل تاريخ البداية.'
                    );
                }
            }
        });
    }
}
