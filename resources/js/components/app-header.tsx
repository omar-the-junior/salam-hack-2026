import { Link, usePage } from '@inertiajs/react';
import {
    CreditCard,
    DollarSign,
    FileText,
    LayoutGrid,
    Link2,
    Mail,
    Menu,
    Settings,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as customersIndex } from '@/routes/customers';
import { index as contractsIndex } from '@/routes/contracts';
import { index as emailScannerIndex } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';
import { index as incomeIndex } from '@/routes/income';
import { index as paymentLinksIndex } from '@/routes/payment-links';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'لوحة التحكم', href: dashboard(), icon: LayoutGrid },
    { title: 'روابط الدفع', href: paymentLinksIndex(), icon: Link2 },
    { title: 'العقود', href: contractsIndex(), icon: FileText },
    { title: 'العملاء', href: customersIndex(), icon: Users },
    { title: 'الإيرادات', href: incomeIndex(), icon: DollarSign },
    { title: 'المصروفات', href: expensesIndex(), icon: CreditCard },
    { title: 'مسح البريد', href: emailScannerIndex(), icon: Mail },
];

export function AppHeader() {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <header className="sticky top-0 z-50 bg-foreground text-background shadow-md">
            <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 md:px-6">
                {/* Mobile drawer trigger */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-background/80 hover:bg-background/10 hover:text-background lg:hidden"
                            aria-label="فتح القائمة"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="flex w-72 flex-col bg-foreground p-0 text-background"
                    >
                        <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
                        <SheetHeader className="relative min-h-16 border-b border-background/10 px-4 py-4">
                            <Link
                                href={dashboard()}
                                className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center"
                            >
                                <AppLogo variant="white" className="h-7" />
                            </Link>
                        </SheetHeader>
                        <nav className="mt-3 flex flex-col gap-1 px-3">
                            {mainNavItems.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center justify-end gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-medium transition-colors',
                                        isCurrentUrl(item.href)
                                            ? 'bg-background/15 text-background shadow-sm'
                                            : 'text-background/70 hover:bg-background/10 hover:text-background',
                                    )}
                                >
                                    <span>{item.title}</span>
                                    {item.icon && (
                                        <item.icon className="size-4 shrink-0 opacity-90" />
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>

                {/* Logo */}
                <Link
                    href={dashboard()}
                    prefetch
                    className="flex shrink-0 items-center gap-2"
                >
                    <AppLogo variant="white" />
                </Link>

                {/* Desktop navigation */}
                <nav className="ms-2 hidden h-full items-center gap-1 lg:flex">
                    {mainNavItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors',
                                isCurrentUrl(item.href)
                                    ? 'bg-background/15 text-background'
                                    : 'text-background/65 hover:bg-background/10 hover:text-background',
                            )}
                        >
                            {item.icon && <item.icon className="size-4 shrink-0" />}
                            {item.title}
                        </Link>
                    ))}
                </nav>

                {/* Right cluster */}
                <div className="ms-auto flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-background/70 hover:bg-background/10 hover:text-background"
                        aria-label="الإعدادات"
                        asChild
                    >
                        <Link href="/settings/profile">
                            <Settings />
                        </Link>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-10 rounded-full p-0.5 hover:bg-background/10"
                                aria-label="قائمة المستخدم"
                            >
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={auth.user?.avatar}
                                        alt={auth.user?.name}
                                    />
                                    <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                        {getInitials(auth.user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {auth.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
