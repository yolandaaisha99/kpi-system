FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    nginx curl zip unzip git \
    oniguruma-dev libpng-dev libxml2-dev

RUN docker-php-ext-install \
    pdo_mysql mbstring exif pcntl bcmath gd xml

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY . .

COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD sh -c "cd /var/www/html && \
           chown -R www-data:www-data storage bootstrap/cache && \
           php artisan config:cache && \
           php artisan route:cache && \
           php artisan view:cache && \
           php-fpm -D && \
           nginx -g 'daemon off;'"