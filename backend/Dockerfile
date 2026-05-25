FROM php:8.2-apache

# Install ekstensi PHP
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libzip-dev zip unzip \
    && docker-php-ext-install pdo pdo_mysql zip gd opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy source code
COPY . .

# Buat .env dari contoh
RUN cp .env.example .env 2>/dev/null || echo "APP_NAME=KPI" > .env

# Install dependencies
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --ignore-platform-reqs \
    --optimize-autoloader

# Set permission
RUN mkdir -p storage/logs storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 storage bootstrap/cache

# Apache config untuk Laravel
RUN sed -i 's|/var/www/html|/var/www/html/public|g' \
    /etc/apache2/sites-available/000-default.conf \
    && a2enmod rewrite

# Port 8080 untuk Cloud Run
ENV APACHE_LISTEN_PORT=8080
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/:80>/:8080>/' /etc/apache2/sites-available/000-default.conf

EXPOSE 8080
CMD ["apache2-foreground"]