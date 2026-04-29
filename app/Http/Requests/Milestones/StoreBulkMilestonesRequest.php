<?php

namespace App\Http\Requests\Milestones;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBulkMilestonesRequest extends FormRequest
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
            'milestones' => ['required', 'array', 'min:1', 'max:5'],
            'milestones.*.title' => ['required', 'string', 'max:255'],
            'milestones.*.percentage' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'milestones.*.due_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'milestones.required' => 'يجب إضافة مرحلة واحدة على الأقل.',
            'milestones.*.title.required' => 'عنوان المرحلة مطلوب.',
            'milestones.*.percentage.required' => 'نسبة المرحلة مطلوبة.',
        ];
    }
}
