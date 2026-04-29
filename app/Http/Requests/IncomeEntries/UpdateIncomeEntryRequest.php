<?php

namespace App\Http\Requests\IncomeEntries;

use App\Models\IncomeEntry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncomeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var IncomeEntry $incomeEntry */
        $incomeEntry = $this->route('incomeEntry');

        return $incomeEntry->user_id === auth()->id();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'currency' => ['sometimes', 'required', 'string', Rule::in(['EGP', 'USD'])],
            'date' => ['sometimes', 'required', 'date'],
            'source_label' => ['nullable', 'string', Rule::in([
                'upwork',
                'fiverr',
                'bank_transfer',
                'fawry',
                'vodafone_cash',
                'other',
            ])],
            'client_name' => ['nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', Rule::in([
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
