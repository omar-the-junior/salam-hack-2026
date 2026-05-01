<?php

namespace App\Http\Requests\Milestones;

use App\Models\Contract;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Contract $contract */
            $contract = $this->route('contract');

            $rows = $this->input('milestones', []);
            if (! is_array($rows)) {
                return;
            }

            $incomingSum = 0.0;
            foreach ($rows as $row) {
                if (! is_array($row) || ! array_key_exists('percentage', $row)) {
                    continue;
                }
                $incomingSum += (float) $row['percentage'];
            }

            $existingSum = (float) $contract->milestones()->sum('percentage');

            if (round($existingSum + $incomingSum, 2) > 100) {
                $validator->errors()->add(
                    'milestones',
                    'إجمالي نسب المراحل لا يجوز أن يتجاوز 100%. المتبقي حالياً: '.round(max(0, 100 - $existingSum), 2).'%',
                );
            }
        });
    }
}
