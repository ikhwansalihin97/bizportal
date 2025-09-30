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
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Basic Information
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('industry')->nullable();
            $table->string('website')->nullable();
            
            // Contact Information
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string('postal_code')->nullable();
            
            // Business Details
            $table->string('logo')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('registration_number')->nullable();
            $table->date('established_date')->nullable();
            $table->integer('employee_count')->nullable();
            
            // Settings
            $table->enum('subscription_plan', ['free', 'basic', 'pro', 'enterprise'])->default('free');
            $table->json('settings')->nullable(); // For additional business settings
            
            // Status and Ownership
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // User stamps - who created, updated, deleted
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->foreignId('deleted_by')->nullable()->constrained('users');
            
            // Soft delete
            $table->softDeletes();
            
            // Indexes
            $table->index(['slug']);
            $table->index(['is_active']);
            $table->index(['created_by']);
            $table->index(['updated_by']);
            $table->index(['subscription_plan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
