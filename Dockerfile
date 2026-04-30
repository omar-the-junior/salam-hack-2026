# STAGE 1: Build Frontend Assets
FROM node:lts-bookworm AS frontend-builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY resources/ ./resources/
COPY routes/ ./routes/
COPY vite.config.ts tsconfig.json components.json ./

ENV DOCKER_BUILD=true
RUN pnpm run build

# ----------------------------------------------------------------

# STAGE 2: Build the Final Production Image
# Contains PHP-FPM, Node (Corepack/pnpm for prod deps and optional SSR), and built assets.
FROM php:8.4-fpm-bookworm

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

RUN docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd zip \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
COPY --from=frontend-builder /usr/local/ /usr/local/

RUN corepack enable

RUN chown www-data:www-data /var/www

USER www-data

COPY --chown=www-data:www-data composer.json composer.lock ./
RUN sed 's_@php artisan package:discover_/bin/true_;' -i composer.json \
    && composer install --no-dev --no-scripts --optimize-autoloader

COPY --chown=www-data:www-data package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --chown=www-data:www-data . .

COPY --from=frontend-builder /app/public/build ./public/build

RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi \
    && composer clear-cache \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chmod +x artisan

USER root

COPY ./scripts/php-entrypoint /usr/local/bin/php-entrypoint
RUN chmod +x /usr/local/bin/php-entrypoint

EXPOSE 9000
CMD ["php-fpm"]
