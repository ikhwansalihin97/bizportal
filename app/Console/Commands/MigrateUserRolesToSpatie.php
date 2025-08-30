<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class MigrateUserRolesToSpatie extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:migrate-roles {--dry-run : Show what would be migrated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing user profile roles to Spatie permission roles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
            $this->line('');
        }

        $this->info('🚀 Starting user role migration...');
        $this->line('');

        // Get all users with profiles but without Spatie roles
        $users = User::with(['profile', 'roles'])
            ->whereHas('profile')
            ->get();

        $migrated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($users as $user) {
            $profileRole = $user->profile->role ?? null;
            $spatieRoles = $user->roles->pluck('name')->toArray();

            // Skip if user has no profile role
            if (!$profileRole) {
                $this->warn("⚠️  User {$user->name} ({$user->email}) has no profile role - skipping");
                $skipped++;
                continue;
            }

            // Map old role names to new ones if needed
            $roleMapping = [
                'business_admin' => 'business-admin',
                // Add other mappings if needed
            ];
            
            $targetRole = $roleMapping[$profileRole] ?? $profileRole;

            // Check if the target role exists in Spatie
            if (!Role::where('name', $targetRole)->exists()) {
                $this->error("❌ Role '{$targetRole}' does not exist in Spatie roles - skipping user {$user->name}");
                $errors++;
                continue;
            }

            // Check if user already has this role
            if (in_array($targetRole, $spatieRoles)) {
                $this->line("✅ User {$user->name} already has role '{$targetRole}' - skipping");
                $skipped++;
                continue;
            }

            if (!$dryRun) {
                try {
                    // Assign the role
                    $user->assignRole($targetRole);
                    $this->info("✅ Assigned role '{$targetRole}' to user {$user->name} ({$user->email})");
                    $migrated++;
                } catch (\Exception $e) {
                    $this->error("❌ Failed to assign role to {$user->name}: " . $e->getMessage());
                    $errors++;
                }
            } else {
                $this->info("🔍 Would assign role '{$targetRole}' to user {$user->name} ({$user->email})");
                $migrated++;
            }
        }

        $this->line('');
        $this->info('📊 Migration Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $migrated],
                ['Skipped', $skipped],
                ['Errors', $errors],
                ['Total', $users->count()],
            ]
        );

        if ($dryRun) {
            $this->line('');
            $this->warn('🔍 This was a dry run. To actually migrate the roles, run:');
            $this->line('php artisan users:migrate-roles');
        } else {
            $this->line('');
            $this->info('🎉 Migration completed!');
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}