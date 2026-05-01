<?php

namespace App\Http\Requests\Milestones;

use App\Models\Contract;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMilestoneRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Contract $contract */
            $contract = $this->route('contract');
            if ($contract->milestones()->count() >= 5) {
                $validator->errors()->add('title', 'يجب ألا يتجاوز عدد المراحل الخمسة.');
            }

            if ($validator->errors()->has('percentage')) {
                return;
            }

            $existingSum = (float) $contract->milestones()->sum('percentage');
            $incoming = (float) $this->input('percentage');

            if (round($existingSum + $incoming, 2) > 100) {
                $validator->errors()->add(
                    'percentage',
                    'إجمالي نسب المراحل لا يجوز أن يتجاوز 100%. المتبقي حالياً: '.round(max(0, 100 - $existingSum), 2).'%',
                );
            }
        });
    }
}
