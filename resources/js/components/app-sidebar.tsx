import { Link } from '@inertiajs/react';
import {
    BookOpen,
    CreditCard,
    DollarSign,
    FileText,
    FolderGit2,
    LayoutGrid,
    Link2,
    Mail,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { create as contractsCreate } from '@/routes/contracts';
import { index as emailScannerIndex } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';
import { index as incomeIndex } from '@/routes/income';
import { index as paymentLinksIndex } from '@/routes/payment-links';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Payment links',
        href: paymentLinksIndex(),
        icon: Link2,
    },
    {
        title: 'Contracts',
        href: contractsCreate(),
        icon: FileText,
    },
    {
        title: 'Income',
        href: incomeIndex(),
        icon: DollarSign,
    },
    {
        title: 'Expenses',
        href: expensesIndex(),
        icon: CreditCard,
    },
    {
        title: 'Email scanner',
        href: emailScannerIndex(),
        icon: Mail,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
