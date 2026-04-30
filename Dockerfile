FROM node:lts-bookworm AS frontend-builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Copy only dependency manifests first to leverage Docker cache
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Install all dependencies (including devDependencies needed for building)
RUN pnpm install --frozen-lockfile

# Copy source code required for the build process
# routes/ is needed so Wayfinder can generate TypeScript bindings during pnpm build
COPY resources/ ./resources/
COPY routes/ ./routes/
COPY vite.config.ts tsconfig.json components.json ./

ENV DOCKER_BUILD=true
RUN pnpm build

# ----------------------------------------------------------------

# STAGE 2: Build the Final Production Image
# Single Apache container — serves HTTP directly on :80 (no separate Nginx needed).
FROM php:8.4-apache-bookworm

WORKDIR /var/www

# --- ROOT-LEVEL TASKS ---
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libsqlite3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_sqlite mbstring exif pcntl bcmath gd zip

# Configure Apache: point document root at Laravel's public/ and allow .htaccess overrides
RUN a2enmod rewrite && \
    { \
        echo '<VirtualHost *:80>'; \
        echo '    DocumentRoot /var/www/public'; \
        echo '    <Directory /var/www/public>'; \
        echo '        Options -Indexes +FollowSymLinks'; \
        echo '        AllowOverride All'; \
        echo '        Require all granted'; \
        echo '    </Directory>'; \
        echo '    ErrorLog ${APACHE_LOG_DIR}/error.log'; \
        echo '    CustomLog ${APACHE_LOG_DIR}/access.log combined'; \
        echo '</VirtualHost>'; \
    } > /etc/apache2/sites-available/000-default.conf

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
COPY --from=frontend-builder /usr/local/ /usr/local/
RUN corepack enable

RUN chown www-data:www-data /var/www

# --- SWITCH TO NON-ROOT USER ---
USER www-data

# --- APPLICATION TASKS (as www-data) ---
# 1. Copy and install PHP dependencies
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN sed 's_@php artisan package:discover_/bin/true_;' -i composer.json \
    && composer install --ignore-platform-req=php --no-dev --no-scripts --optimize-autoloader

COPY --chown=www-data:www-data package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY --chown=www-data:www-data . .

COPY --from=frontend-builder /app/public/build ./public/build

# Finalize composer and set permissions
RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi \
    && composer clear-cache \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chmod +x artisan

# --- FINAL ROOT-LEVEL TASKS ---
USER root

COPY ./scripts/php-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
