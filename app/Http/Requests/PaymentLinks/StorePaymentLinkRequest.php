<?php

namespace App\Http\Requests\PaymentLinks;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentLinkRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'currency' => ['required', 'string', 'in:EGP,USD'],
            'customer_id' => [
                'nullable',
                'uuid',
                Rule::exists('customers', 'id')->where('user_id', auth()->id()),
            ],
            'description' => ['required', 'string', 'max:1000'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'email', 'max:255'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
