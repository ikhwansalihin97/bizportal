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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique(); // For public-facing URLs
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Employee submitting claim
            $table->foreignId('submitted_by')->constrained('users')->onDelete('cascade'); // Who submitted the claim
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null'); // Who approved/rejected
            
            // Claim details
            $table->decimal('amount', 10, 2); // Amount claimed
            $table->string('category')->default('general'); // travel, meals, office_supplies, etc.
            $table->string('expense_type')->default('reimbursement'); // reimbursement, petty_cash, etc.
            $table->text('description'); // Description of the expense
            $table->text('purpose')->nullable(); // Business purpose
            
            // Expense details
            $table->date('expense_date'); // When the expense occurred
            $table->string('vendor')->nullable(); // Vendor/supplier name
            $table->string('invoice_number')->nullable(); // Invoice/receipt number
            $table->string('payment_method')->nullable(); // How the employee paid
            
            // Status and workflow
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid', 'cancelled'])->default('pending');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            
            // Approval details
            $table->text('approval_notes')->nullable(); // Notes from approver
            $table->text('rejection_reason')->nullable(); // Reason if rejected
            $table->decimal('approved_amount', 10, 2)->nullable(); // Amount approved (might be different from claimed)
            
            // Reimbursement tracking
            $table->decimal('reimbursed_amount', 10, 2)->default(0); // Amount already reimbursed
            $table->decimal('remaining_amount', 10, 2); // Amount still owed
            $table->boolean('is_fully_reimbursed')->default(false);
            
            // Metadata
            $table->json('attachments')->nullable(); // Receipts, invoices, supporting documents
            $table->json('settings')->nullable(); // Additional business-specific settings
            $table->softDeletes(); // Add soft delete support
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['business_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['expense_date']);
            $table->index(['category']);
            $table->index(['submitted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};
