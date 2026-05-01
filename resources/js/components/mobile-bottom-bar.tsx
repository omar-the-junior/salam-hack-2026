import { Link } from '@inertiajs/react';
import { Ellipsis } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Dock, DockIcon } from '@/components/ui/dock';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

type MobileBottomBarProps = {
    primaryItems: NavItem[];
    secondaryItems?: NavItem[];
};

export function MobileBottomBar({
    primaryItems,
    secondaryItems = [],
}: MobileBottomBarProps) {
    const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
    const { isCurrentUrl } = useCurrentUrl();
    const hasActiveSecondaryItem = secondaryItems.some((item) =>
        isCurrentUrl(item.href),
    );

    return (
        <div
            className="fixed inset-x-3 bottom-3 z-50 md:hidden"
            data-testid="mobile-bottom-bar"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <Dock
                disableMagnification
                iconSize={50}
                className="mt-0 h-[78px] w-full max-w-md items-center justify-around border-border/70 bg-background/80 pb-1 pt-1 shadow-lg backdrop-blur-xl"
            >
                {primaryItems.map((item) => {
                    const active = isCurrentUrl(item.href);

                    return (
                        <DockIcon key={item.title} className="relative shrink-0">
                            <Link
                                href={item.href}
                                prefetch
                                aria-label={item.title}
                                className="relative flex size-full flex-col items-center justify-center gap-1"
                            >
                                <span className="relative flex size-9 items-center justify-center">
                                    {active ? (
                                        <motion.span
                                            layoutId="active-tab"
                                            className="absolute inset-0 rounded-full bg-primary/20"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 34,
                                            }}
                                        />
                                    ) : null}
                                    {item.icon ? (
                                        <item.icon
                                            className={cn(
                                                'relative z-10 size-5 transition-transform active:scale-95',
                                                active
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground',
                                            )}
                                            aria-hidden
                                        />
                                    ) : null}
                                </span>
                                <span
                                    className={cn(
                                        'max-w-16 truncate text-[11px] font-medium leading-tight',
                                        active
                                            ? 'text-primary'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {item.title}
                                </span>
                            </Link>
                        </DockIcon>
                    );
                })}
                {secondaryItems.length > 0 ? (
                    <Drawer
                        open={isMoreDrawerOpen}
                        onOpenChange={setIsMoreDrawerOpen}
                    >
                        <DockIcon className="relative shrink-0">
                            <DrawerTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="المزيد"
                                    className="relative flex size-full flex-col items-center justify-center gap-1"
                                >
                                    <span className="relative flex size-9 items-center justify-center">
                                        {hasActiveSecondaryItem ? (
                                            <motion.span
                                                layoutId="active-tab"
                                                className="absolute inset-0 rounded-full bg-primary/20"
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 34,
                                                }}
                                            />
                                        ) : null}
                                        <Ellipsis
                                            className={cn(
                                                'relative z-10 size-5 transition-transform active:scale-95',
                                                hasActiveSecondaryItem
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground',
                                            )}
                                            aria-hidden
                                        />
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium leading-tight',
                                            hasActiveSecondaryItem
                                                ? 'text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        المزيد
                                    </span>
                                </button>
                            </DrawerTrigger>
                        </DockIcon>
                        <DrawerContent className="rounded-t-3xl border-border/70 bg-background/95 px-4 pb-6 pt-2 shadow-2xl backdrop-blur-xl">
                            <DrawerHeader className="pb-2 text-right">
                                <DrawerTitle className="text-xl font-semibold tracking-tight">
                                    المزيد
                                </DrawerTitle>
                            </DrawerHeader>
                            <nav
                                className="mt-3 flex flex-col gap-3 pb-[calc(env(safe-area-inset-bottom)+8px)]"
                                aria-label="روابط إضافية"
                            >
                                {secondaryItems.map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        onClick={() => setIsMoreDrawerOpen(false)}
                                        className={cn(
                                            'flex items-center justify-end gap-3 rounded-2xl border px-4 py-4 text-right text-base font-medium shadow-sm transition-colors',
                                            isCurrentUrl(item.href)
                                                ? 'border-primary/25 bg-primary/10 text-primary'
                                                : 'border-border/80 bg-background text-foreground hover:bg-muted/40',
                                        )}
                                    >
                                        <span>{item.title}</span>
                                        {item.icon ? (
                                            <item.icon className="size-5" aria-hidden />
                                        ) : null}
                                    </Link>
                                ))}
                            </nav>
                        </DrawerContent>
                    </Drawer>
                ) : null}
            </Dock>
        </div>
    );
}
