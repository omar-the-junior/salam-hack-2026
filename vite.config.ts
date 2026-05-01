import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        VitePWA({
            /**
             * Laravel sets Vite `base` to `/build/` for hashed assets. vite-plugin-pwa
             * otherwise reuses that as manifest + SW scope, which makes `start_url: '/'`
             * invalid (must be under scope). The app and SW live at site root, not /build/.
             */
            scope: '/',
            /**
             * 'prompt' — we manage the update lifecycle ourselves via useRegisterSW,
             * showing a branded sonner toast instead of silently reloading mid-session.
             */
            registerType: 'prompt',
            strategies: 'generateSW',
            /**
             * Crucial for Laravel: Explicitly tell VitePWA to output to the public root
             * rather than Laravel's default 'public/build' directory. This ensures the
             * service worker is served from /sw.js with a root scope (/).
             */
            outDir: 'public',
            buildBase: '/build/',
            /**
             * Do NOT inject the manifest/SW registration script into an index.html —
             * this app uses a Blade template. We handle the <link rel="manifest"> and
             * registration script manually.
             */
            injectRegister: 'script-defer',
            manifest: {
                name: 'مُسْتَحَقّ',
                short_name: 'مُسْتَحَقّ',
                description: 'النظام المالي للمستقلين وأصحاب الأعمال الصغيرة',
                start_url: '/',
                display: 'standalone',
                orientation: 'portrait',
                theme_color: '#0E2945',
                background_color: '#F7F2E8',
                lang: 'ar',
                dir: 'rtl',
                categories: ['finance', 'business', 'productivity'],
                icons: [
                    {
                        src: '/logo/logo-icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/logo/logo-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/pwa-maskable-max.png',
                        sizes: '1024x1024',
                        type: 'image/png',
                        purpose: 'maskable',
                    }
                ],
                // TODO: add screenshots for a good preview of the app
                // screenshots: [],
            },
            workbox: {
                /**
                 * CRITICAL for Laravel: null means the SW will NOT intercept navigation
                 * requests, so Laravel's server-side routing continues to work correctly.
                 * Without this the SW would return stale HTML for all page navigations.
                 */
                navigateFallback: null,
                /**
                 * Precache compiled JS, CSS, fonts, and static images only.
                 * Exclude Laravel's PHP-served routes and API endpoints.
                 */
                globPatterns: ['**/*.{js,css,woff,woff2,ttf,eot,ico,png,svg,webp}'],
                globIgnores: ['**/node_modules/**', '**/build/manifest.json'],
                /**
                 * Exclude server-side routes from precache navigation handling.
                 */
                navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/__debugbar\//],
                /**
                 * Clean up outdated caches on SW activation so users never serve
                 * stale assets after a deployment.
                 */
                cleanupOutdatedCaches: true,
                /**
                 * Skip waiting so the new SW activates as soon as all tabs are closed,
                 * paired with our update prompt that asks users to reload.
                 */
                skipWaiting: false,
                clientsClaim: true,
            },
            devOptions: {
                /**
                 * Keep development clean — no SW in dev mode to avoid caching issues
                 * and Vite HMR conflicts. Test PWA features against the built app.
                 */
                enabled: false,
            },
        }),
        // In Docker builds the wayfinder-generator stage has already produced the
        // TypeScript files; skip the plugin so it doesn't attempt to call PHP again.
        ...(process.env.DOCKER_BUILD
            ? []
            : [
                  wayfinder({
                      formVariants: true,
                      // Default also watches `app/**/Http/**/*.php`. Regenerating rewrites
                      // `resources/js/routes/*` and can race with Vite transforms (e.g.
                      // "Soft-invalidated module ... should not have existing transform result"
                      // when opening pages that import those files). Route files alone are
                      // enough for typical URL changes; run `php artisan wayfinder:generate --with-form`
                      // after changing controller signatures without touching routes.
                      patterns: ['routes/**/*.php'],
                  }),
              ]),
    ],
    server: {
        // Avoid eager dependency warmup racing with soft-invalidation (Vite 8 dev).
        preTransformRequests: false,
    },
});
