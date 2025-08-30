<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salary_types', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Salary type information
            $table->string('name'); // e.g., 'Hourly', 'Daily', 'Monthly'
            $table->string('code')->unique(); // e.g., 'hourly', 'daily', 'monthly'
            $table->string('unit'); // e.g., 'hour', 'day', 'month'
            $table->text('description')->nullable();
            $table->boolean('allows_overtime')->default(true);
            
            // User stamps
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_types');
    }
};
