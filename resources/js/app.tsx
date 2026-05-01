import { getInitialPageFromDOM } from '@inertiajs/core';
import { createInertiaApp, router } from '@inertiajs/react';
import { DirectionProvider } from '@/components/ui/direction';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const inertiaRootId = 'app';

function readSharedAppNameFromPage(page: { props?: { name?: unknown } } | null | undefined): string | null {
    const name = page?.props?.name;

    return typeof name === 'string' && name.trim() !== '' ? name : null;
}

let sharedAppName: string | null =
    typeof document !== 'undefined' ? readSharedAppNameFromPage(getInitialPageFromDOM(inertiaRootId)) : null;

if (typeof window !== 'undefined') {
    const syncSharedAppName = (event: Event): void => {
        const page = (event as CustomEvent<{ page: { props?: { name?: unknown } } }>).detail?.page;
        const name = readSharedAppNameFromPage(page);

        if (name) {
            sharedAppName = name;
        }
    };

    router.on('navigate', syncSharedAppName);
    router.on('success', syncSharedAppName);
}

function resolveAppName(): string {
    if (sharedAppName) {
        return sharedAppName;
    }

    const viteName = import.meta.env.VITE_APP_NAME;

    if (typeof viteName === 'string' && viteName.trim() !== '') {
        return viteName;
    }

    return 'مُسْتَحَقّ';
}

createInertiaApp({
    id: inertiaRootId,
    title: (title) => {
        const appName = resolveAppName();

        return title ? `${title} - ${appName}` : appName;
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'terms':
            case name === 'privacy':
            case name === 'blog':
            case name.startsWith('onboarding/'):
                return null;
            case name.startsWith('auth/'):
            case name.startsWith('pay/'):
                return AuthLayout;
            case name === 'contracts/review':
                return null;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <DirectionProvider dir="rtl">
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </DirectionProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
