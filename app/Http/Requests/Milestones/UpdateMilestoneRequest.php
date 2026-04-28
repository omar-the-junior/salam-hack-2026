<?php

namespace App\Http\Requests\Milestones;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMilestoneRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'in:pending,in_progress,submitted,paid'],
        ];
    }
}
