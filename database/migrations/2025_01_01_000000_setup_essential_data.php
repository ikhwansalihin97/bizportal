<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\BusinessFeature;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create superadmin user
        $superadminUser = User::firstOrCreate(
            ['email' => config('superadmin.email')],
            [
                'name' => config('superadmin.name'),
                'password' => Hash::make(config('superadmin.password')),
                'email_verified_at' => now(),
            ]
        );

        // Create or update superadmin profile
        $superadminProfile = UserProfile::firstOrCreate(
            ['user_id' => $superadminUser->id],
            [
                'role' => 'superadmin',
                'status' => 'active',
                'job_title' => 'System Administrator',
                'phone' => '+1234567890',
            ]
        );

        // Create business features
        $features = [
            [
                'name' => 'Attendance Management',
                'slug' => 'attendance',
                'description' => 'Track employee attendance, time in/out, and generate attendance reports.',
                'category' => 'hr',
                'settings' => [
                    'allow_overtime' => true,
                    'require_approval' => false,
                    'auto_calculate_hours' => true,
                ],
            ],
            [
                'name' => 'Leave Management',
                'slug' => 'leave',
                'description' => 'Manage employee leave requests, approvals, and leave balances.',
                'category' => 'hr',
                'settings' => [
                    'require_approval' => true,
                    'allow_negative_balance' => false,
                    'auto_approve_sick_leave' => false,
                ],
            ],
            [
                'name' => 'Payroll Management',
                'slug' => 'payroll',
                'description' => 'Calculate and process employee payroll, taxes, and deductions.',
                'category' => 'finance',
                'settings' => [
                    'auto_calculate_tax' => true,
                    'include_overtime' => true,
                    'allow_manual_adjustments' => true,
                ],
            ],
            [
                'name' => 'Project Management',
                'slug' => 'projects',
                'description' => 'Manage projects, tasks, and team collaboration.',
                'category' => 'general',
                'settings' => [
                    'allow_file_attachments' => true,
                    'enable_time_tracking' => true,
                    'require_task_assignments' => true,
                ],
            ],
            [
                'name' => 'Inventory Management',
                'slug' => 'inventory',
                'description' => 'Track inventory levels, stock movements, and generate reports.',
                'category' => 'operations',
                'settings' => [
                    'low_stock_alerts' => true,
                    'auto_reorder' => false,
                    'track_expiry_dates' => true,
                ],
            ],
            [
                'name' => 'Customer Relationship Management',
                'slug' => 'crm',
                'description' => 'Manage customer relationships, leads, and sales pipeline.',
                'category' => 'sales',
                'settings' => [
                    'lead_scoring' => true,
                    'email_integration' => true,
                    'sales_forecasting' => true,
                ],
            ],
            [
                'name' => 'Document Management',
                'slug' => 'documents',
                'description' => 'Store, organize, and manage business documents and files.',
                'category' => 'general',
                'settings' => [
                    'version_control' => true,
                    'access_control' => true,
                    'search_functionality' => true,
                ],
            ],
            [
                'name' => 'Reporting & Analytics',
                'slug' => 'analytics',
                'description' => 'Generate business reports and analytics dashboards.',
                'category' => 'general',
                'settings' => [
                    'real_time_data' => true,
                    'custom_reports' => true,
                    'data_export' => true,
                ],
            ],
        ];

        foreach ($features as $feature) {
            BusinessFeature::firstOrCreate(
                ['slug' => $feature['slug']],
                $feature
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove superadmin user
        $superadminUser = User::where('email', config('superadmin.email'))->first();
        if ($superadminUser) {
            $superadminUser->delete();
        }
        
        // Remove business features
        BusinessFeature::truncate();
    }
};
