<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $targetUser = $this->route('user') ?? Auth::user();
        
        // Users can update their own profile, superadmins can update any profile
        return $targetUser->id === Auth::id() || Auth::user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $targetUser = $this->route('user') ?? Auth::user();
        
        return [
            // Basic user info
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users')->ignore($targetUser->id),
            ],
            
            // Profile information
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female',
            'job_title' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'employee_id' => 'nullable|string|max:50',
            
            // System fields (only superadmin can modify)
            'role' => [
                'sometimes',
                'string',
                'max:50',
                function ($attribute, $value, $fail) {
                    if (!Auth::user()->isSuperAdmin()) {
                        $fail('Only superadmins can modify user roles.');
                    }
                },
            ],
            'status' => [
                'sometimes',
                Rule::in(['active', 'inactive', 'suspended']),
                function ($attribute, $value, $fail) {
                    if (!Auth::user()->isSuperAdmin()) {
                        $fail('Only superadmins can modify user status.');
                    }
                },
            ],
            
            // Preferences
            'preferences' => 'nullable|array',
            'preferences.timezone' => 'nullable|string|max:50',
            'preferences.language' => 'nullable|string|max:10',
            'preferences.notifications' => 'nullable|array',
            'preferences.notifications.email' => 'nullable|boolean',
            'preferences.notifications.sms' => 'nullable|boolean',
            'preferences.notifications.push' => 'nullable|boolean',
            'preferences.theme' => 'nullable|in:light,dark,auto',
            'preferences.date_format' => 'nullable|string|max:20',
            'preferences.time_format' => 'nullable|in:12,24',
            'preferences.currency' => 'nullable|string|size:3',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.max' => 'Name cannot exceed 255 characters.',
            'email.email' => 'Email must be a valid email address.',
            'email.unique' => 'This email address is already taken.',
            'phone.max' => 'Phone number cannot exceed 20 characters.',
            'address.max' => 'Address cannot exceed 500 characters.',
            'date_of_birth.before' => 'Date of birth must be before today.',
            'gender.in' => 'Gender must be either male or female.',
            'job_title.max' => 'Job title cannot exceed 100 characters.',
            'department.max' => 'Department cannot exceed 100 characters.',
            'employee_id.max' => 'Employee ID cannot exceed 50 characters.',
            'role.in' => 'Invalid role selected.',
            'status.in' => 'Invalid status selected.',
            'preferences.timezone.max' => 'Timezone cannot exceed 50 characters.',
            'preferences.language.max' => 'Language code cannot exceed 10 characters.',
            'preferences.theme.in' => 'Theme must be light, dark, or auto.',
            'preferences.time_format.in' => 'Time format must be 12 or 24 hour.',
            'preferences.currency.size' => 'Currency code must be exactly 3 characters.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'date_of_birth' => 'date of birth',
            'job_title' => 'job title',
            'employee_id' => 'employee ID',
            'preferences.timezone' => 'timezone',
            'preferences.language' => 'language',
            'preferences.theme' => 'theme',
            'preferences.date_format' => 'date format',
            'preferences.time_format' => 'time format',
            'preferences.currency' => 'currency',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure preferences is an array if provided
        if ($this->has('preferences') && is_string($this->preferences)) {
            $this->merge([
                'preferences' => json_decode($this->preferences, true) ?? [],
            ]);
        }
    }
}
