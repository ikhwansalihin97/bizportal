<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BusinessStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::user()->isSuperAdmin() || Auth::user()->profile?->role === 'business_admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'industry' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:50',
            'established_date' => 'nullable|date|before:today',
            'employee_count' => 'nullable|integer|min:1|max:1000000',
            'subscription_plan' => 'nullable|in:free,basic,pro,enterprise',
            'settings' => 'nullable|array',
            'settings.timezone' => 'nullable|string|max:50',
            'settings.currency' => 'nullable|string|size:3',
            'settings.language' => 'nullable|string|max:10',
            'settings.date_format' => 'nullable|string|max:20',
            'settings.notifications' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Business name is required.',
            'name.max' => 'Business name cannot exceed 255 characters.',
            'website.url' => 'Website must be a valid URL.',
            'email.email' => 'Email must be a valid email address.',
            'established_date.before' => 'Establishment date must be before today.',
            'employee_count.min' => 'Employee count must be at least 1.',
            'employee_count.max' => 'Employee count cannot exceed 1,000,000.',
            'subscription_plan.in' => 'Invalid subscription plan selected.',
            'settings.currency.size' => 'Currency code must be exactly 3 characters.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'business name',
            'description' => 'business description',
            'established_date' => 'establishment date',
            'employee_count' => 'number of employees',
            'subscription_plan' => 'subscription plan',
            'settings.timezone' => 'timezone',
            'settings.currency' => 'currency',
            'settings.language' => 'language',
        ];
    }
}
