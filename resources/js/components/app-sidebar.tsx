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
    Users,
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
import { index as customersIndex } from '@/routes/customers';
import { index as contractsIndex } from '@/routes/contracts';
import { index as emailScannerIndex } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';
import { index as incomeIndex } from '@/routes/income';
import { index as paymentLinksIndex } from '@/routes/payment-links';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'لوحة التحكم',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'روابط الدفع',
        href: paymentLinksIndex(),
        icon: Link2,
    },
    {
        title: 'العقود',
        href: contractsIndex(),
        icon: FileText,
    },
    {
        title: 'العملاء',
        href: customersIndex(),
        icon: Users,
    },
    {
        title: 'الإيرادات',
        href: incomeIndex(),
        icon: DollarSign,
    },
    {
        title: 'المصروفات',
        href: expensesIndex(),
        icon: CreditCard,
    },
    {
        title: 'مسح البريد',
        href: emailScannerIndex(),
        icon: Mail,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'المستودع',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'التوثيق',
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
