# Deployment Guide

This document covers the production Docker deployment for Mustahaq on Dokploy (DigitalOcean), using GitHub Actions to build and push images to GitHub Container Registry (GHCR).

---

## Architecture

```
git push main
    → GitHub Actions builds Docker image
    → image pushed to ghcr.io/GITHUB_USER/salam-hack:main
    → webhook triggers Dokploy
    → Dokploy pulls new image and restarts container
```

The production container is a single `php:8.4-apache` image that:
- Serves HTTP on port 80 (Dokploy's reverse proxy handles SSL termination)
- Runs `php artisan migrate` and `php artisan optimize` on every startup
- Persists the SQLite database and storage in named Docker volumes

---

## What Was Done

| File | Change |
|---|---|
| `Dockerfile` | Switched from `php:8.4-fpm` to `php:8.4-apache`; removed PostgreSQL/Redis; added SQLite (`pdo_sqlite`); configured Apache virtual host with `mod_rewrite` and `AllowOverride All` |
| `scripts/php-entrypoint` | Created — initialises SQLite file, fixes permissions, runs migrations, caches config/routes/views, starts Apache |
| `docker-compose.prod.yml` | Simplified to single `app` service; removed nginx service and `public_assets` volume; added `database` volume; port changed from 9000 to 80 |
| `.docker/nginx.*.conf` | Deleted — Apache is embedded in the image |
| `.github/workflows/deploy.yml` | No changes needed — already correctly pushes to GHCR and triggers the Dokploy webhook |

---

## One-Time Setup

### 1. Update the image name in `docker-compose.prod.yml`

Replace the placeholder with your actual GitHub repository:

```yaml
image: ghcr.io/omar-the-junior/salam-hack-2026:main
```

This must match the image the GitHub Actions workflow produces. The workflow uses `${{ github.repository }}` which resolves to `username/repo-name` (lowercase).

### 2. Add GitHub Repository Secret

In your GitHub repository → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|---|---|
| `DOKPLOY_DEPLOYMENT_HOOK` | The webhook URL from Dokploy → your app → **Deployments** tab → **Webhook** URL |

No other secrets are needed. `GITHUB_TOKEN` (used to push to GHCR) is provided automatically by GitHub Actions.

### 3. Configure Dokploy

1. Create a new **Docker Compose** application in Dokploy
2. Set the source to your `docker-compose.prod.yml` (either paste it or connect via Git)
3. Under **Domains**, point your domain to the `app` service on port **80**
4. If your GHCR package is **private**: go to **Registry** in Dokploy and add a GitHub Personal Access Token with `read:packages` scope

### 4. Set Environment Variables in Dokploy

In Dokploy → your app → **Environment** tab, add the following. You can also supply a `.env` file if Dokploy supports it.

#### Required

| Variable | Production value |
|---|---|
| `APP_NAME` | `"مُسْتَحَقّ"` |
| `APP_ENV` | `production` |
| `APP_KEY` | Generate: `php artisan key:generate --show` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://your-domain.com` |

#### Database (SQLite — no host/port/user needed)

| Variable | Value |
|---|---|
| `DB_CONNECTION` | `sqlite` |

#### Session / Cache / Queue

| Variable | Value |
|---|---|
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |

#### Logging

| Variable | Value |
|---|---|
| `LOG_CHANNEL` | `stack` |
| `LOG_LEVEL` | `error` |

#### OAuth (Google)

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://your-domain.com/auth/google/callback` |

#### Payments (Paymob)

| Variable | Value |
|---|---|
| `PAYMOB_API_KEY` | Your Paymob API key |
| `PAYMOB_INTEGRATION_ID` | Your Paymob integration ID |
| `PAYMOB_IFRAME_ID` | Your Paymob iframe ID |
| `PAYMOB_HMAC_SECRET` | Your Paymob HMAC secret |

#### AI

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GEMINI_CANCEL_SUBSCRIPTION_MODEL` | `gemini-3-flash-preview` (free) or `gemini-3.1-pro-preview` (paid) |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `OPENROUTER_CANCEL_SUBSCRIPTION_MODEL` | Your preferred model slug |
| `OPENROUTER_EMAIL_PARSER_MODEL` | Your preferred model slug |

#### Mail

| Variable | Value |
|---|---|
| `MAIL_MAILER` | `smtp` (or `mailgun`, `ses`, etc.) |
| `MAIL_HOST` | Your SMTP host |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | Your SMTP username |
| `MAIL_PASSWORD` | Your SMTP password |
| `MAIL_FROM_ADDRESS` | `noreply@your-domain.com` |
| `MAIL_FROM_NAME` | `"مُسْتَحَقّ"` |

---

## Deployment Flow (after setup)

1. Push to `main` → GitHub Actions triggers automatically
2. Actions builds the image and pushes `ghcr.io/USER/salam-hack:main` to GHCR
3. Actions POSTs to the Dokploy webhook
4. Dokploy pulls the new image and performs a rolling restart
5. On container start, the entrypoint runs migrations and re-caches configuration

---

## Testing the Image Locally

```bash
# Build
docker build -t mustahaq:local .

# Run (minimal env — adjust APP_KEY to a real generated value)
docker run --rm -p 8080:80  -e APP_KEY="base64:REPLACE_WITH_REAL_KEY"  -e APP_ENV=production  -e APP_DEBUG=false  -e APP_URL=http://localhost:8080  -e DB_CONNECTION=sqlite  -e SESSION_DRIVER=database  -e CACHE_STORE=database  -e QUEUE_CONNECTION=database  mustahaq:local
```

Visit `http://localhost:8080`. The entrypoint will create the SQLite file, run migrations, and start Apache.

---

## Persistent Data

Three named Docker volumes are used:

| Volume | Container path | Purpose |
|---|---|---|
| `storage` | `/var/www/storage` | Uploaded files, logs, framework cache |
| `database` | `/var/www/database` | SQLite database file |
| `bootstrap-cache` | `/var/www/bootstrap/cache` | Laravel bootstrap cache |

These volumes are **not deleted** on redeployment. To reset the database, you must manually delete the `database` volume in Dokploy or on the host.
