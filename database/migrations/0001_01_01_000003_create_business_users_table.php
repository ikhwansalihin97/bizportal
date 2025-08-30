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
        Schema::create('business_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Role within this specific business
            $table->string('business_role')->default('employee');
            
            // Permissions for this business
            $table->json('permissions')->nullable(); // Specific permissions within the business
            
            // Employment details
            $table->date('joined_date')->default(now());
            $table->date('left_date')->nullable();
            $table->enum('employment_status', ['active', 'inactive', 'terminated'])->default('active');
            $table->text('notes')->nullable(); // Internal notes about the user's role
            
            // Invitation tracking
            $table->string('invitation_token')->nullable();
            $table->timestamp('invitation_sent_at')->nullable();
            $table->timestamp('invitation_accepted_at')->nullable();
            $table->foreignId('invited_by')->nullable()->constrained('users');
            
            $table->timestamps();
            
            // User stamps - who created, updated, deleted
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->foreignId('deleted_by')->nullable()->constrained('users');
            
            // Soft delete
            $table->softDeletes();
            
            // Unique constraint - user can have only one active role per business
            $table->unique(['business_id', 'user_id']);
            
            // Indexes
            $table->index(['business_id']);
            $table->index(['user_id']);
            $table->index(['business_role']);
            $table->index(['employment_status']);
            $table->index(['invitation_token']);
            $table->index(['created_by']);
            $table->index(['updated_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_users');
    }
};
