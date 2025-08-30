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
        Schema::table('attendances', function (Blueprint $table) {
            // Remove the unique constraint that prevents multiple attendance records per day
            $table->dropUnique(['user_id', 'business_id', 'work_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Re-add the unique constraint if we need to rollback
            $table->unique(['user_id', 'business_id', 'work_date']);
        });
    }
};
