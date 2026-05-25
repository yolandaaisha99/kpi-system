FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    nginx curl zip unzip git \
    oniguruma-dev libpng-dev libxml2-dev \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_mysql mbstring exif pcntl bcmath gd xml opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy SEMUA file dulu, baru composer install
COPY . .

# Install dependencies
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --ignore-platform-reqs \
    --optimize-autoloader

# Setup .env
RUN cp .env.example .env 2>/dev/null || echo "APP_NAME=KPI\nAPP_ENV=production\nAPP_KEY=\nAPP_DEBUG=false\nLOG_CHANNEL=stderr\nDB_CONNECTION=mysql" > .env

# Generate key
RUN php artisan key:generate --force

# Set permissions
RUN mkdir -p storage/logs storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data /var/www/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy supervisord config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]