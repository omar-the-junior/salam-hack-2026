<?php

namespace App\Http\Requests\ExpenseCards;

use App\Models\ExpenseCard;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseCardStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var ExpenseCard $expense */
        $expense = $this->route('expense');

        return $expense->user_id === auth()->id();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(['active', 'paused', 'cancelled'])],
        ];
    }
}
