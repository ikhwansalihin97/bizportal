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
        Schema::create('business_features', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category')->default('general'); // general, hr, finance, etc.
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable(); // Feature-specific settings
            $table->timestamps();
        });

        Schema::create('business_feature_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('feature_id')->constrained('business_features')->onDelete('cascade');
            $table->boolean('is_enabled')->default(false);
            $table->json('settings')->nullable(); // Business-specific feature settings
            $table->timestamp('enabled_at')->nullable();
            $table->foreignId('enabled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['business_id', 'feature_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_feature_assignments');
        Schema::dropIfExists('business_features');
    }
};
