import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import {
    mobilePrimaryNavItems,
    mobileSecondaryNavItems,
} from '@/components/app-nav-items';
import { AppShell } from '@/components/app-shell';
import { MobileBottomBar } from '@/components/mobile-bottom-bar';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({ children }: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader />
            <AppContent variant="header" className="pb-24 md:pb-0">
                {children}
            </AppContent>
            <MobileBottomBar
                primaryItems={mobilePrimaryNavItems}
                secondaryItems={mobileSecondaryNavItems}
            />
        </AppShell>
    );
}
