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
        Schema::table('business_users', function (Blueprint $table) {
            // Change business_role from enum to string
            $table->string('business_role')->default('employee')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_users', function (Blueprint $table) {
            // Revert back to enum
            $table->enum('business_role', [
                'owner', 'admin', 'manager', 'employee', 'contractor', 'viewer'
            ])->default('employee')->change();
        });
    }
};
