#!/bin/bash

# Deployment script for Raspberry Pi
echo "🚀 Starting deployment to Raspberry Pi..."

# Step 1: Stop current services
echo "📋 Step 1: Stopping current services..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && pm2 stop all 2>/dev/null || true"
ssh ikhwan@ikhwanpi.local "pm2 delete all 2>/dev/null || true"

# Step 2: Backup current application
echo "📋 Step 2: Backing up current application..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan && mv bizportalv1 bizportalv1_backup_$(date +%Y%m%d_%H%M%S)"

# Step 3: Create new directory and transfer files
echo "📋 Step 3: Transferring new application..."
ssh ikhwan@ikhwanpi.local "mkdir -p /home/ikhwan/bizportalv1"

# Transfer the application files
rsync -avz --exclude='node_modules' --exclude='vendor' --exclude='.git' --exclude='storage/logs/*' --exclude='storage/framework/cache/*' ./ ikhwan@ikhwanpi.local:/home/ikhwan/bizportalv1/

# Step 4: Install dependencies on Pi
echo "📋 Step 4: Installing dependencies on Raspberry Pi..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && composer install --optimize-autoloader --no-dev"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && npm install"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && npm run build"

# Step 5: Set up environment
echo "📋 Step 5: Setting up environment..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && cp .env.example .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && php artisan key:generate"

# Step 6: Configure database
echo "📋 Step 6: Configuring database..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's/DB_HOST=db/DB_HOST=localhost/' .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's/DB_DATABASE=bizportalv1/DB_DATABASE=bizportalv1_prod/' .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's/DB_USERNAME=root/DB_USERNAME=bizportalv1/' .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's/DB_PASSWORD=secret/DB_PASSWORD=bizportalv1_prod_2024/' .env"

# Step 7: Set production environment
echo "📋 Step 7: Setting production environment..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's/APP_ENV=local/APP_ENV=production/' .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && sed -i 's|APP_URL=http://localhost:8000|APP_URL=https://bizportal.ikhwansalihin.com|' .env"

# Step 7.5: Set superadmin credentials
echo "📋 Step 7.5: Setting superadmin credentials..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && echo 'SUPERADMIN_NAME=SuperAdmin' >> .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && echo 'SUPERADMIN_EMAIL=admin@bizportalv1.com' >> .env"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && echo 'SUPERADMIN_PASSWORD=11' >> .env"

# Step 8: Set proper permissions
echo "📋 Step 8: Setting permissions..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && chmod -R 755 storage bootstrap/cache"
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && chown -R ikhwan:ikhwan ."

# Step 9: Run migrations
echo "📋 Step 9: Running database migrations..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && php artisan migrate --force"

# Step 10: Create PM2 ecosystem file
echo "📋 Step 10: Creating PM2 configuration..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'bizportalv1',
      script: 'php',
      args: 'artisan serve --host=0.0.0.0 --port=8000',
      cwd: '/home/ikhwan/bizportalv1',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Transfer PM2 config
scp ecosystem.config.cjs ikhwan@ikhwanpi.local:/home/ikhwan/bizportalv1/

# Step 11: Start the application
echo "📋 Step 11: Starting application with PM2..."
ssh ikhwan@ikhwanpi.local "cd /home/ikhwan/bizportalv1 && pm2 start ecosystem.config.cjs"
ssh ikhwan@ikhwanpi.local "pm2 save"
ssh ikhwan@ikhwanpi.local "pm2 startup"

# Step 12: Update Cloudflare tunnel (if needed)
echo "📋 Step 12: Application deployed successfully!"
echo "🌐 Your application should now be accessible at: https://bizportal.ikhwansalihin.com"
echo "🔧 Database admin: https://db.ikhwansalihin.com"
echo ""
echo "📝 Next steps:"
echo "1. Update your Cloudflare tunnel to point to localhost:8000"
echo "2. Test the application at https://bizportal.ikhwansalihin.com"
echo "3. Login with: admin@bizportalv1.com / 11"
echo ""
echo "✅ Deployment completed!"
