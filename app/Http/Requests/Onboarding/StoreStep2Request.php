<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreStep2Request extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'preferred_currency' => ['required', 'string', 'size:3'],
            'profession' => ['required', 'string', 'max:255'],
        ];
    }
}
