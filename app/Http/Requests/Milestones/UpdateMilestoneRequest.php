<?php

namespace App\Http\Requests\Milestones;

use App\Models\Milestone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('percentage') || $validator->errors()->has('percentage')) {
                return;
            }

            /** @var Milestone $milestone */
            $milestone = $this->route('milestone');
            $contract = $milestone->contract;

            $otherSum = (float) $contract->milestones()
                ->where('id', '!=', $milestone->id)
                ->sum('percentage');
            $newPercentage = (float) $this->input('percentage');

            if (round($otherSum + $newPercentage, 2) > 100) {
                $validator->errors()->add(
                    'percentage',
                    'إجمالي نسب المراحل لا يجوز أن يتجاوز 100%. المتبقي لبقية المراحل: '.round(max(0, 100 - $otherSum), 2).'%',
                );
            }
        });
    }
}
