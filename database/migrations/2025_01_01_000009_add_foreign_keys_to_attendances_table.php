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
            $table->foreign('salary_rate_id')->references('id')->on('salary_rates')->onDelete('set null');
            $table->foreign('overtime_rate_id')->references('id')->on('overtime_rates')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['salary_rate_id']);
            $table->dropForeign(['overtime_rate_id']);
        });
    }
};
