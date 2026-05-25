FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    nginx \
    curl \
    zip \
    unzip \
    git \
    oniguruma-dev \
    libpng-dev \
    libxml2-dev

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    xml

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy semua source code
COPY . .

# Laravel setup
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

CMD sh -c "php artisan config:cache && \
           php artisan route:cache && \
           php artisan view:cache && \
           php-fpm -D && \
           nginx -g 'daemon off;'"

# Nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD sh -c "php-fpm -D && nginx -g 'daemon off;'"