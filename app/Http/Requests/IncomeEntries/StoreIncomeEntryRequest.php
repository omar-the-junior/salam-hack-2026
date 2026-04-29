<?php

namespace App\Http\Requests\IncomeEntries;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncomeEntryRequest extends FormRequest
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
            'currency' => ['required', 'string', Rule::in(['EGP', 'USD'])],
            'date' => ['required', 'date'],
            'source_label' => ['required', 'string', Rule::in([
                'upwork',
                'fiverr',
                'bank_transfer',
                'fawry',
                'vodafone_cash',
                'other',
            ])],
            'client_name' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in([
                'freelance',
                'product_sale',
                'consulting',
                'content',
                'other',
            ])],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
