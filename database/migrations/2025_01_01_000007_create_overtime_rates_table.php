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
        Schema::create('overtime_rates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Foreign keys
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('salary_type_id')->constrained()->onDelete('cascade');
            
            // Overtime rate information
            $table->string('name'); // e.g., 'Regular Overtime', 'Holiday Overtime'
            $table->string('code')->unique(); // e.g., 'regular_ot', 'holiday_ot'
            $table->enum('rate_type', ['multiplier', 'fixed'])->default('multiplier');
            $table->decimal('multiplier', 5, 2)->nullable(); // e.g., 1.5 for 150% of base rate
            $table->decimal('fixed_rate', 8, 2)->nullable(); // Fixed rate per unit
            $table->json('conditions')->nullable(); // JSON conditions for when this rate applies
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            
            // User stamps
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['business_id', 'salary_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('overtime_rates');
    }
};
