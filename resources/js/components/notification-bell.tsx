import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { readAll as readAllRoute } from '@/routes/notifications';
import type { AppNotification } from '@/types';

function timeAgo(isoString: string): string {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function NotificationBell() {
    const { notifications } = usePage().props as { notifications: AppNotification[] };
    const [open, setOpen] = useState(false);
    const [localNotifs, setLocalNotifs] = useState<AppNotification[]>(notifications ?? []);
    const hasMarked = useRef(false);

    // Sync when Inertia refreshes shared props
    useEffect(() => {
        setLocalNotifs(notifications ?? []);
        hasMarked.current = false;
    }, [notifications]);

    const unreadCount = localNotifs.filter((n) => !n.read_at).length;

    function handleOpenChange(isOpen: boolean) {
        setOpen(isOpen);

        if (isOpen && unreadCount > 0 && !hasMarked.current) {
            hasMarked.current = true;
            // Optimistically clear badges immediately
            setLocalNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
            router.patch(readAllRoute.url(), {}, { preserveScroll: true, preserveState: true });
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    id="notification-bell-trigger"
                    variant="ghost"
                    size="icon"
                    className="relative text-background/70 hover:bg-background/10 hover:text-background"
                    aria-label="الإشعارات"
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 p-0 overflow-hidden"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">الإشعارات</span>
                    {localNotifs.length > 0 && (
                        <span className="text-xs text-muted-foreground">{localNotifs.length} إشعار</span>
                    )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {localNotifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                            <Bell className="size-8 opacity-30" />
                            <p className="text-sm">لا توجد إشعارات</p>
                        </div>
                    ) : (
                        localNotifs.map((notif) => (
                            <NotificationItem key={notif.id} notification={notif} onClose={() => setOpen(false)} />
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationItem({ notification, onClose }: { notification: AppNotification; onClose: () => void }) {
    const { data, created_at } = notification;

    const inner = (
        <div className={cn(
            "flex items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/50 relative",
            !notification.read_at && "bg-primary/5"
        )}>
            {/* Unread dot indicator */}
            {!notification.read_at && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary" aria-hidden />
            )}
            
            {/* Emoji / icon from title prefix */}
            <span className="mt-0.5 shrink-0 text-lg leading-none" aria-hidden>
                {data.title?.match(/^\p{Emoji}/u)?.[0] ?? '🔔'}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-snug">
                    {data.title?.replace(/^\p{Emoji}\s*/u, '')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{data.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(created_at)}</p>
            </div>
        </div>
    );

    if (data.action_url) {
        return (
            <Link href={data.action_url} onClick={onClose} className="block">
                {inner}
            </Link>
        );
    }

    return <div>{inner}</div>;
}
