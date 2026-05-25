FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    nginx curl zip unzip git supervisor \
    oniguruma-dev libpng-dev libxml2-dev

RUN docker-php-ext-install \
    pdo_mysql mbstring exif pcntl bcmath gd xml opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --ignore-platform-reqs \
    --optimize-autoloader

RUN mkdir -p storage/logs storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache \
    && chown -R www-data:www-data /var/www/html

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]