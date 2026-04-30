import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

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
        // Skip during Docker builds — PHP isn't available in the Node builder stage.
        // The already-committed generated files in resources/js/routes/ and
        // resources/js/actions/ are used as-is. Run `php artisan wayfinder:generate
        // --with-form` locally after changing routes or controller signatures.
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
