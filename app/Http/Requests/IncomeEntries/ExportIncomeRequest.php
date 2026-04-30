<?php

namespace App\Http\Requests\IncomeEntries;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'month' => ['sometimes', 'nullable', 'regex:/^\d{4}-\d{2}$/'],
            'source' => ['sometimes', 'nullable', 'string', Rule::in(['all', 'payment_link', 'manual', 'email_parsed'])],
            'category' => ['sometimes', 'nullable', 'string', 'max:64'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
