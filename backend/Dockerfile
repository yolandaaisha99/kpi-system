FROM php:8.2-fpm-alpine
RUN apk add --no-cache \
    nginx curl zip unzip git supervisor \
    oniguruma-dev libpng-dev libxml2-dev
RUN docker-php-ext-install \
    pdo_mysql mbstring exif pcntl bcmath gd xml opcache
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --optimize-autoloader
RUN mkdir -p storage/logs storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache \
    && chown -R www-data:www-data /var/www/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
EXPOSE 8080
CMD sh -c "cd /var/www/html && \
           chown -R www-data:www-data storage bootstrap/cache && \
           php artisan package:discover --ansi && \
           php artisan config:cache && \
           (php artisan migrate --force || echo 'Migration skipped') && \
           php-fpm -D && \
           nginx -g 'daemon off;'"