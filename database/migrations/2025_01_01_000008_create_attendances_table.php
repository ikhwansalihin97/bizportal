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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Foreign keys - using existing business_users structure
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('salary_rate_id')->nullable();
            $table->foreignId('overtime_rate_id')->nullable();
            
            // Attendance data
            $table->date('work_date');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->decimal('regular_units', 8, 2)->default(0); // Regular hours worked
            $table->decimal('overtime_units', 8, 2)->default(0); // Overtime hours
            $table->json('break_times')->nullable(); // Array of break periods
            $table->text('notes')->nullable();
            
            // Status
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // User stamps
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['business_id', 'work_date']);
            $table->index(['user_id', 'work_date']);
            $table->unique(['user_id', 'business_id', 'work_date']); // One attendance per user per business per day
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
