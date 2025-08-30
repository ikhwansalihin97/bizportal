<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SalaryType;

class SalaryTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $salaryTypes = [
            [
                'name' => 'Hourly',
                'code' => 'hourly',
                'unit' => 'hour',
                'description' => 'Salary calculated per hour worked',
                'allows_overtime' => true,
            ],
            [
                'name' => 'Daily',
                'code' => 'daily',
                'unit' => 'day',
                'description' => 'Salary calculated per day worked',
                'allows_overtime' => true,
            ],
            [
                'name' => 'Monthly',
                'code' => 'monthly',
                'unit' => 'month',
                'description' => 'Fixed monthly salary',
                'allows_overtime' => false,
            ],
            [
                'name' => 'Weekly',
                'code' => 'weekly',
                'unit' => 'week',
                'description' => 'Salary calculated per week worked',
                'allows_overtime' => true,
            ],
        ];

        foreach ($salaryTypes as $salaryType) {
            SalaryType::updateOrCreate(
                ['code' => $salaryType['code']],
                $salaryType
            );
        }
    }
}
