import {
    CreditCard,
    DollarSign,
    FileText,
    LayoutGrid,
    Link2,
    Mail,
    Users,
} from 'lucide-react';

import { dashboard } from '@/routes';
import { index as contractsIndex } from '@/routes/contracts';
import { index as customersIndex } from '@/routes/customers';
import { index as emailScannerIndex } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';
import { index as incomeIndex } from '@/routes/income';
import { index as paymentLinksIndex } from '@/routes/payment-links';
import type { NavItem } from '@/types';

export const mainNavItems: NavItem[] = [
    { title: 'لوحة التحكم', href: dashboard(), icon: LayoutGrid },
    { title: 'روابط الدفع', href: paymentLinksIndex(), icon: Link2 },
    { title: 'العقود', href: contractsIndex(), icon: FileText },
    { title: 'العملاء', href: customersIndex(), icon: Users },
    { title: 'الإيرادات', href: incomeIndex(), icon: DollarSign },
    { title: 'المصروفات', href: expensesIndex(), icon: CreditCard },
    { title: 'مسح البريد', href: emailScannerIndex(), icon: Mail },
];

/** Primary items shown directly on the mobile bottom dock. */
export const mobilePrimaryNavItems: NavItem[] = mainNavItems.slice(0, 4);

/** Remaining destinations available behind the mobile "more" action. */
export const mobileSecondaryNavItems: NavItem[] = mainNavItems.slice(4);
