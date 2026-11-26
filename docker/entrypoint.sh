#!/bin/sh
set -e

# Default port to 80 if not set by Render
export PORT="${PORT:-80}"

# Substitute port into nginx configuration
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure writable directories exist with correct permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/app/private \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Run database migrations if DB configuration is present (fail-fast on error)
if [ -n "$DB_URL" ] || [ -n "$DB_HOST" ]; then
    echo "Running production database migrations..."
    php artisan migrate --force
fi

# Cache configuration, routes, and views for production performance
echo "Caching Laravel configuration and routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting VerityWeb services on port ${PORT}..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
