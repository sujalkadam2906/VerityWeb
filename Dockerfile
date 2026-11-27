# ==========================================
# Stage 1: Build Frontend Assets (Vite)
# ==========================================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Stage 2: PHP 8.3 FPM + Nginx Application
# ==========================================
FROM php:8.3-fpm-alpine

# Install system dependencies, Nginx, and Supervisord
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    gettext \
    libpng-dev \
    libzip-dev \
    postgresql-dev \
    icu-dev \
    oniguruma-dev \
    git \
    unzip

# Install PHP extensions required by Laravel & PostgreSQL
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    zip \
    bcmath \
    intl \
    fileinfo \
    opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application source code
COPY . /var/www/html

# Copy compiled frontend assets from Stage 1
COPY --from=frontend /app/public/build /var/www/html/public/build

# Install PHP production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Copy Docker configurations
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /docker/entrypoint.sh

RUN chmod +x /docker/entrypoint.sh

# Set directory permissions for Laravel storage and cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80 10000

ENTRYPOINT ["/docker/entrypoint.sh"]
