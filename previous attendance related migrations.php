Schema::create('work_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
    $table->foreignId('salary_rate_id')->constrained('salary_rates');
    $table->date('work_date');
    $table->time('start_time');
    $table->time('end_time');
    $table->decimal('regular_units', 8, 2); // Regular hours/days worked
    $table->decimal('overtime_units', 8, 2)->default(0); // Overtime hours/days
    $table->foreignId('overtime_rate_id')->nullable()->constrained('overtime_rates');
    $table->json('break_times')->nullable(); // Array of break periods
    $table->text('notes')->nullable();
    $table->string('status')->default('pending'); // pending, approved, rejected
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->timestamp('approved_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});


Schema::create('salary_types', function (Blueprint $table) {
    $table->id();
    $table->string('name'); // e.g., 'Hourly', 'Daily'
    $table->string('code')->unique(); // e.g., 'hourly', 'daily'
    $table->string('unit'); // e.g., 'hour', 'day'
    $table->text('description')->nullable();
    $table->boolean('allows_overtime')->default(true);
    $table->timestamps();
    $table->softDeletes();
});


Schema::create('salary_rates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
    $table->foreignId('salary_type_id')->constrained('salary_types');
    $table->decimal('base_rate', 10, 2); // Base rate per unit (hour/day)
    $table->json('additional_rates')->nullable(); // For any additional rates (e.g., weekend rates)
    $table->date('effective_from');
    $table->date('effective_until')->nullable();
    $table->boolean('is_active')->default(true);
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

Schema::create('overtime_rates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('salary_type_id')->constrained('salary_types');
    $table->string('name'); // e.g., 'Regular Overtime', 'Holiday Overtime'
    $table->string('code')->unique(); // e.g., 'regular_ot', 'holiday_ot'
    $table->decimal('multiplier', 5, 2); // e.g., 1.5 for 150% of base rate
    $table->json('conditions')->nullable(); // JSON conditions for when this rate applies
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});


Schema::table('work_logs', function (Blueprint $table) {
    $table->time('end_time')->nullable()->change();
});


Schema::table('overtime_rates', function (Blueprint $table) {
// Add rate type to distinguish between multiplier and fixed rates
$table->enum('rate_type', ['multiplier', 'fixed'])->default('multiplier')->after('code');

// Add fixed rate field for fixed overtime rates
$table->decimal('fixed_rate', 8, 2)->nullable()->after('multiplier');

// Make multiplier nullable since fixed rates won't use it
$table->decimal('multiplier', 5, 2)->nullable()->change();
});