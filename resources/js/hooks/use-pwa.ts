import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Wraps vite-plugin-pwa's service worker registration hook.
 *
 * - `needsRefresh`         — true when a new service worker is waiting (new deployment available).
 * - `offlineReady`         — true when the app's static assets are fully precached.
 * - `updateServiceWorker`  — call this to skip-wait and reload when a new version is ready.
 * - `close`                — dismiss the update prompt without reloading.
 */
export function usePwa() {
    const {
        needRefresh: [needsRefresh],
        offlineReady: [offlineReady],
        updateServiceWorker,
    } = useRegisterSW({
        /**
         * Check for SW updates every hour to catch deployments made while
         * the user has the app open.
         */
        onRegisteredSW(_swUrl, registration) {
            if (registration) {
                setInterval(
                    () => {
                        registration.update();
                    },
                    60 * 60 * 1000,
                );
            }
        },
        onRegisterError(error) {
            console.error('[PWA] Service worker registration failed:', error);
        },
    });

    return {
        needsRefresh,
        offlineReady,
        updateServiceWorker,
    };
}
