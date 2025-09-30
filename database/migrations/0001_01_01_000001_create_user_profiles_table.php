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
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Personal Information
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('avatar')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            
            // Professional Information
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->string('employee_id')->nullable();
            
            // System Information - Updated to use correct enum values from the start
            $table->string('role')->default('employee');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->timestamp('last_login')->nullable();
            
            // Preferences
            $table->json('preferences')->nullable(); // For additional settings
            
            $table->timestamps();
            
            // User stamps - who created, updated, deleted
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->foreignId('deleted_by')->nullable()->constrained('users');
            
            // Soft delete
            $table->softDeletes();
            
            // Indexes
            $table->index(['user_id']);
            $table->index(['role']);
            $table->index(['status']);
            $table->index(['created_by']);
            $table->index(['updated_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
