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
        Schema::create('advances', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique(); // For public-facing URLs
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Employee requesting advance
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade'); // Who submitted the request
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null'); // Who approved/rejected
            
            // Advance details
            $table->decimal('amount', 10, 2); // Amount requested (10 digits, 2 decimal places)
            $table->string('type')->default('cash'); // cash, bank_transfer, check, etc.
            $table->text('purpose'); // Purpose of the advance
            $table->text('description')->nullable(); // Additional details
            
            // Status and workflow
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid', 'cancelled'])->default('pending');
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->date('due_date')->nullable(); // When advance should be repaid
            $table->date('advance_date')->nullable(); // Date when advance was actually taken
            
            // Approval details
            $table->text('approval_notes')->nullable(); // Notes from approver
            $table->text('rejection_reason')->nullable(); // Reason if rejected
            
            // Repayment tracking
            $table->decimal('repaid_amount', 10, 2)->default(0); // Amount already repaid
            $table->decimal('remaining_amount', 10, 2)->default(0); // Amount still owed
            $table->boolean('is_fully_repaid')->default(false);
            
            // Metadata
            $table->json('attachments')->nullable(); // File attachments (receipts, documents)
            $table->json('settings')->nullable(); // Additional business-specific settings
            $table->softDeletes(); // Add soft delete support
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['business_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['requested_at']);
            $table->index(['due_date']);
            $table->index(['advance_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advances');
    }
};
