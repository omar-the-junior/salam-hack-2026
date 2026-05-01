import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Bell,
    CalendarClock,
    ChevronDown,
    Clock3,
    CreditCard,
    DollarSign,
    FileText,
    Link2,
    Mail,
    MoreHorizontal,
    Pause,
    Plus,
    Receipt,
    Sparkles,
    TrendingDown,
    TrendingUp,
    WalletCards,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as contractIndex } from '@/routes/contracts';
import { index as emailScannerIndex } from '@/routes/email-scanner';
import { create as expenseCreate, index as expenseIndex } from '@/routes/expenses';
import { create as incomeCreate, index as incomeIndex } from '@/routes/income';
import {
    create as paymentLinkCreate,
    index as paymentLinkIndex,
} from '@/routes/payment-links';
import { dismiss as renewalAlertDismiss } from '@/routes/renewal-alerts';

type PaymentStatus = 'paid' | 'pending' | 'overdue';
type AttentionSeverity = 'danger' | 'warning' | 'info' | 'success';
type ChecklistItem = {
    key: string;
    label: string;
    href: string;
    checked: boolean;
    cta: string;
};
type DashboardChecklist = {
    show: boolean;
    items: ChecklistItem[];
    is_static_fallback?: boolean;
};
type WalletBalanceRow = {
    currency: string;
    balance_cents: number;
    balance: number;
    formatted_balance: string;
};
type KpisData = {
    this_month_income: number;
    this_month_income_change: number | null;
    pending_amount: number;
    pending_count: number;
    overdue_amount: number;
    overdue_count: number;
    currency: string;
};
type PaymentLinkItem = {
    client: string;
    description: string;
    amount: number;
    status: string;
    initials: string;
};
type RenewalItem = {
    service: string;
    amount: number;
    currency: string;
    category: string;
    billing_cycle: string;
    next_renewal_date: string;
    days_left: number;
    initials: string;
};
type IncomeBreakdownSource = {
    source: string;
    label: string;
    amount: number;
    percentage: number;
};
type IncomeBreakdownData = {
    total: number;
    currency: string;
    sources: IncomeBreakdownSource[];
};
type ChartDataPoint = {
    month: string;
    income: number;
    expenses: number;
};
type AttentionItem = {
    title: string;
    description: string;
    action: string;
    severity: string;
    type: string;
    alertId?: string;
};
type SummaryStats = {
    pending_payment_links: number;
    active_contracts: number;
    income_entries_this_month: number;
    active_expense_cards: number;
};

const sourceColorPalette = [
    {
        bar: 'bg-success',
        progress: '[&_[data-slot=progress-indicator]]:bg-success',
    },
    {
        bar: 'bg-primary',
        progress: '[&_[data-slot=progress-indicator]]:bg-primary',
    },
    {
        bar: 'bg-warning',
        progress: '[&_[data-slot=progress-indicator]]:bg-warning',
    },
    {
        bar: 'bg-chart-4',
        progress: '[&_[data-slot=progress-indicator]]:bg-chart-4',
    },
    {
        bar: 'bg-chart-5',
        progress: '[&_[data-slot=progress-indicator]]:bg-chart-5',
    },
];

const attentionIconMap: Record<string, React.ComponentType<{ 'aria-hidden'?: boolean }>> = {
    overdue_payment: AlertCircle,
    renewal_soon: CalendarClock,
    gmail_unlinked: Mail,
    pending_review: Sparkles,
};

const billingCycleLabels: Record<string, string> = {
    monthly: 'شهري',
    annual: 'سنوي',
    one_time: 'مرة واحدة',
};

const chartConfig = {
    income: {
        label: 'الدخل',
        color: 'var(--color-chart-1)',
    },
    expenses: {
        label: 'المصروفات',
        color: 'var(--color-chart-2)',
    },
} satisfies ChartConfig;

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ar-EG', {
        maximumFractionDigits: 0,
    }).format(value);

function formatWalletDisplay(currency: string, balance: number): string {
    try {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(balance);
    } catch {
        return `${balance.toFixed(2)} ${currency}`;
    }
}

function currencyLabel(currency: string): string {
    return currency === 'EGP' ? 'ج.م' : currency;
}

function formatRenewalDate(dateStr: string): { month: string; day: string; fullDate: string } {
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.toLocaleDateString('ar-EG', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const fullDate = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });

    return { month, day, fullDate };
}

function statusLabel(status: PaymentStatus) {
    return {
        paid: 'مدفوع',
        pending: 'قيد التحصيل',
        overdue: 'متأخر',
    }[status];
}

function statusBadgeClass(status: PaymentStatus) {
    return cn({
        'bg-success text-success-foreground': status === 'paid',
        'bg-warning text-warning-foreground': status === 'pending',
        'bg-destructive text-destructive-foreground': status === 'overdue',
    });
}

function toneClass(tone: string) {
    return cn({
        'bg-success/10 text-success': tone === 'success',
        'bg-warning/10 text-warning': tone === 'warning',
        'bg-destructive/10 text-destructive': tone === 'danger',
        'bg-primary/10 text-primary': tone === 'primary',
    });
}

function attentionClass(severity: AttentionSeverity) {
    return cn({
        'bg-destructive/10 text-destructive': severity === 'danger',
        'bg-warning/10 text-warning': severity === 'warning',
        'bg-primary/10 text-primary': severity === 'info',
        'bg-success/10 text-success': severity === 'success',
    });
}

export default function Dashboard({
    checklist,
    walletBalances = [],
    kpis,
    recentPaymentLinks = [],
    upcomingRenewals = [],
    incomeBreakdown,
    chartData = [],
    attentionItems = [],
    summaryStats,
}: {
    checklist?: DashboardChecklist;
    walletBalances?: WalletBalanceRow[];
    kpis?: KpisData;
    recentPaymentLinks?: PaymentLinkItem[];
    upcomingRenewals?: RenewalItem[];
    incomeBreakdown?: IncomeBreakdownData;
    chartData?: ChartDataPoint[];
    attentionItems?: AttentionItem[];
    summaryStats?: SummaryStats;
}) {
    const { auth } = usePage().props;
    const user = auth.user as { name: string; display_name?: string; role?: string; profession?: string };

    const [showChecklist, setShowChecklist] = useState(Boolean(checklist?.show));
    const [expandedRenewal, setExpandedRenewal] = useState(0);
    const [openRenewalMenu, setOpenRenewalMenu] = useState<number | null>(null);
    const [activeRenewalReminders, setActiveRenewalReminders] = useState<string[]>([]);

    const renewalCategoryClass = (category: string) =>
        ({
            تصميم: 'bg-primary/10 text-primary',
            إنتاجية: 'bg-success/10 text-success',
            استضافة: 'bg-warning/15 text-warning',
            'ذكاء اصطناعي': 'bg-secondary text-secondary-foreground',
        })[category] ?? 'bg-secondary text-secondary-foreground';

    const renewalReminderActive = (service: string) =>
        activeRenewalReminders.includes(service);

    const toggleRenewalReminder = (service: string) =>
        setActiveRenewalReminders((previous) =>
            previous.includes(service)
                ? previous.filter((item) => item !== service)
                : [...previous, service],
        );

    const primaryWallet = walletBalances[0] ?? null;

    const resolvedChecklist = checklist?.items ?? [
        {
            key: 'account',
            label: 'تم إنشاء الحساب',
            href: dashboard(),
            checked: true,
            cta: 'مكتمل',
        },
        {
            key: 'payment_link',
            label: 'أنشئ أول رابط دفع',
            href: paymentLinkCreate(),
            checked: false,
            cta: 'ابدأ',
        },
        {
            key: 'contract',
            label: 'أنشئ عقد مشروع',
            href: contractIndex(),
            checked: false,
            cta: 'ابدأ',
        },
        {
            key: 'expense',
            label: 'أضف مصروف/اشتراك',
            href: expenseCreate(),
            checked: false,
            cta: 'ابدأ',
        },
        {
            key: 'gmail',
            label: 'اربط Gmail',
            href: emailScannerIndex(),
            checked: false,
            cta: 'ربط',
        },
    ];

    const userName = user.display_name ?? user.name;
    const userRole = user.profession ?? (user.role as string | undefined) ?? 'مستقل';

    const kpiCurrency = kpis?.currency ?? 'EGP';
    const incomeChange = kpis?.this_month_income_change;
    const incomeChangeLabel =
        incomeChange !== null && incomeChange !== undefined
            ? `${incomeChange > 0 ? '+' : ''}${incomeChange}% عن الشهر السابق`
            : 'لا توجد بيانات الشهر السابق';

    const kpiCards = [
        {
            label: 'إجمالي دخل هذا الشهر',
            value: kpis?.this_month_income ?? 0,
            helper: incomeChangeLabel,
            icon: DollarSign,
            tone: 'success',
        },
        {
            label: 'المبالغ قيد التحصيل',
            value: kpis?.pending_amount ?? 0,
            helper:
                kpis && kpis.pending_count > 0
                    ? `${kpis.pending_count} روابط دفع مفتوحة`
                    : 'لا توجد مدفوعات معلقة',
            icon: Clock3,
            tone: 'warning',
        },
        {
            label: 'المبالغ المتأخرة',
            value: kpis?.overdue_amount ?? 0,
            helper:
                kpis && kpis.overdue_count > 0
                    ? `${kpis.overdue_count} تحتاج تذكير اليوم`
                    : 'لا توجد مبالغ متأخرة',
            icon: AlertCircle,
            tone: 'danger',
        },
    ];

    return (
        <>
            <Head title="لوحة التحكم" />
            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-hidden p-4 md:p-6">
                <section
                    aria-labelledby="dashboard-hero-title"
                    className="relative overflow-hidden rounded-4xl bg-foreground p-6 text-background shadow-lg md:p-8"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--color-primary)_0,transparent_32%),radial-gradient(circle_at_88%_10%,var(--color-accent)_0,transparent_24%)] opacity-20" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3">
                            <Badge
                                variant="secondary"
                                className="w-fit rounded-full bg-background/10 text-background"
                            >
                                {userRole} · مُستحق
                            </Badge>
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-background/70">صباح الخير،</p>
                                <h1
                                    id="dashboard-hero-title"
                                    className="font-display text-3xl font-bold tracking-tight md:text-4xl"
                                >
                                    {userName}
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-background/70 md:text-base">
                                    راقب الدخل، التحصيل، الاشتراكات، والمهام المالية المهمة
                                    من مكان واحد.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button asChild size="lg">
                                <Link href={paymentLinkCreate()}>
                                    <Plus data-icon="inline-start" />
                                    إنشاء رابط دفع
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="bg-background/10 text-background hover:bg-background/15"
                                    >
                                        إجراءات سريعة
                                        <ChevronDown data-icon="inline-end" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link href={contractIndex()}>
                                                <FileText />
                                                عقد جديد
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={incomeCreate()}>
                                                <Receipt />
                                                إضافة دخل
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={expenseCreate()}>
                                                <CreditCard />
                                                إضافة مصروف
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </section>

                {showChecklist && (
                    <Card className="border-primary/20 bg-secondary/80 shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <CardTitle>ابدأ مع مُستحق</CardTitle>
                                <CardDescription>
                                    أكمل الخطوات الأساسية لبناء سير عملك المالي
                                    من أول يوم.
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="إخفاء قائمة البدء"
                                onClick={() => {
                                    setShowChecklist(false);
                                    router.post('/dashboard/checklist-dismiss');
                                }}
                            >
                                <X />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {resolvedChecklist.map((item) => (
                                    <div
                                        key={item.key}
                                        className="flex items-center justify-between gap-3 rounded-xl border bg-card/70 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={item.checked}
                                                aria-label={item.label}
                                            />
                                            <span className="text-sm font-medium">
                                                {item.label}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            className="shrink-0"
                                            disabled={item.cta === 'مكتمل'}
                                        >
                                            <Link href={item.href}>
                                                {item.cta}
                                                <ArrowLeft data-icon="inline-end" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">
                                {checklist?.is_static_fallback
                                    ? 'بعض حالات القائمة تعمل بوضع تجريبي لحين اكتمال وحدات الدفع/المصروفات/ربط البريد.'
                                    : 'هذه القائمة مرتبطة بحالة بياناتك الحالية ويتم تحديثها تلقائيًا.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <section
                    aria-label="صف بطاقات الملخص"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {primaryWallet ? (
                        <Card key="wallet-balance" className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <CardDescription>رصيد المحفظة</CardDescription>
                                    <CardTitle className="text-3xl tabular-nums">
                                        {formatWalletDisplay(
                                            primaryWallet.currency,
                                            primaryWallet.balance,
                                        )}
                                    </CardTitle>
                                </div>
                                <div
                                    className={cn(
                                        'flex size-11 items-center justify-center rounded-2xl',
                                        toneClass('primary'),
                                    )}
                                >
                                    <WalletCards aria-hidden />
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Badge
                                    variant="secondary"
                                    className={cn('rounded-full', toneClass('primary'))}
                                >
                                    {primaryWallet.currency} · المحفظة الأساسية
                                </Badge>
                            </CardFooter>
                        </Card>
                    ) : null}
                    {kpiCards.map((item) => (
                        <Card key={item.label} className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <CardDescription>{item.label}</CardDescription>
                                    <CardTitle className="text-3xl tabular-nums">
                                        {formatCurrency(item.value)}
                                        <span className="me-1 text-sm font-medium text-muted-foreground">
                                            {currencyLabel(kpiCurrency)}
                                        </span>
                                    </CardTitle>
                                </div>
                                <div
                                    className={cn(
                                        'flex size-11 items-center justify-center rounded-2xl',
                                        toneClass(item.tone),
                                    )}
                                >
                                    <item.icon aria-hidden />
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Badge
                                    variant="secondary"
                                    className={cn('rounded-full', toneClass(item.tone))}
                                >
                                    {item.helper}
                                </Badge>
                            </CardFooter>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <CardTitle>روابط الدفع الأخيرة</CardTitle>
                                <CardDescription>
                                    آخر طلبات التحصيل من العملاء
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon">
                                    <ArrowRight />
                                    <span className="sr-only">السابق</span>
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft />
                                    <span className="sr-only">التالي</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {recentPaymentLinks.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    لا توجد روابط دفع حتى الآن
                                </p>
                            ) : (
                                recentPaymentLinks.map((item) => (
                                    <div
                                        key={`${item.client}-${item.description}`}
                                        className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar className="size-11 rounded-2xl">
                                                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
                                                    {item.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {item.client}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <span className="text-sm font-semibold tabular-nums">
                                                {formatCurrency(item.amount)}{' '}
                                                {currencyLabel(kpiCurrency)}
                                            </span>
                                            <Badge
                                                className={statusBadgeClass(
                                                    item.status as PaymentStatus,
                                                )}
                                            >
                                                {statusLabel(item.status as PaymentStatus)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" asChild className="w-full">
                                <Link href={paymentLinkIndex()}>
                                    عرض كل روابط الدفع
                                    <ArrowLeft data-icon="inline-end" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <CardTitle>الفواتير والمدفوعات</CardTitle>
                                <CardDescription>
                                    جدولة الاشتراكات والمدفوعات القادمة
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal />
                                <span className="sr-only">خيارات الفواتير والمدفوعات</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {upcomingRenewals.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    لا توجد اشتراكات قادمة
                                </p>
                            ) : (
                                upcomingRenewals.map((item, index) => {
                                    const { month, day, fullDate } = formatRenewalDate(
                                        item.next_renewal_date,
                                    );

                                    return (
                                        <div
                                            key={item.service}
                                            className={cn(
                                                'overflow-hidden rounded-2xl border bg-card transition-all',
                                                expandedRenewal === index && 'shadow-sm',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-3 p-3 text-start"
                                                onClick={() =>
                                                    setExpandedRenewal(
                                                        expandedRenewal === index ? -1 : index,
                                                    )
                                                }
                                            >
                                                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-muted">
                                                    <span className="text-[10px] font-semibold text-primary">
                                                        {month}
                                                    </span>
                                                    <span className="text-sm font-bold tabular-nums">
                                                        {day}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-6 rounded-md">
                                                            <AvatarFallback className="rounded-md bg-primary/10 text-[11px] text-primary">
                                                                {item.initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="truncate text-sm font-semibold">
                                                            {item.service}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                'rounded-full border-0 px-2 py-0 text-[11px]',
                                                                renewalCategoryClass(
                                                                    item.category,
                                                                ),
                                                            )}
                                                        >
                                                            {item.category}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {fullDate}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {billingCycleLabels[item.billing_cycle] ??
                                                            item.billing_cycle}
                                                    </p>
                                                    <p className="text-sm font-semibold tabular-nums">
                                                        {formatCurrency(item.amount)}{' '}
                                                        {currencyLabel(item.currency)}
                                                    </p>
                                                </div>
                                                <DropdownMenu
                                                    open={openRenewalMenu === index}
                                                    onOpenChange={(open) =>
                                                        setOpenRenewalMenu(open ? index : null)
                                                    }
                                                >
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 shrink-0"
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                        >
                                                            <MoreHorizontal />
                                                            <span className="sr-only">
                                                                خيارات {item.service}
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Pause />
                                                            إيقاف مؤقت
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                            <X />
                                                            إلغاء الاشتراك
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </button>

                                            <div
                                                className="grid transition-all duration-300 ease-out"
                                                style={{
                                                    gridTemplateRows:
                                                        expandedRenewal === index ? '1fr' : '0fr',
                                                }}
                                            >
                                                <div className="overflow-hidden">
                                                    <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-3 py-2.5">
                                                        <span
                                                            className={cn(
                                                                'text-xs text-muted-foreground',
                                                                item.days_left <= 7 &&
                                                                    'font-medium text-warning',
                                                            )}
                                                        >
                                                            الدفع القادم خلال {item.days_left}{' '}
                                                            أيام
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className={cn(
                                                                'h-8 rounded-lg px-2.5 text-xs',
                                                                renewalReminderActive(
                                                                    item.service,
                                                                ) &&
                                                                    'border-primary/40 bg-primary/10 text-primary',
                                                            )}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                toggleRenewalReminder(
                                                                    item.service,
                                                                );
                                                            }}
                                                        >
                                                            {renewalReminderActive(item.service) ? (
                                                                <>
                                                                    <Bell data-icon="inline-start" />
                                                                    التذكير مفعل
                                                                </>
                                                            ) : (
                                                                'تفعيل تذكير'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" asChild className="w-full">
                                <Link href={expenseIndex()}>
                                    إدارة الاشتراكات
                                    <ArrowLeft data-icon="inline-end" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>توزيع مصادر الدخل</CardTitle>
                            <CardDescription>
                                كيف دخلت الأموال إلى مُستحق هذا الشهر
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي الدخل</p>
                                <p className="text-3xl font-bold tabular-nums">
                                    {formatCurrency(incomeBreakdown?.total ?? 0)}{' '}
                                    {currencyLabel(incomeBreakdown?.currency ?? kpiCurrency)}
                                </p>
                            </div>
                            {incomeBreakdown && incomeBreakdown.sources.length > 0 ? (
                                <>
                                    <div
                                        className="flex h-3 overflow-hidden rounded-full bg-muted"
                                        aria-label="توزيع مصادر الدخل"
                                    >
                                        {incomeBreakdown.sources.map((source, idx) => (
                                            <div
                                                key={source.source}
                                                className={
                                                    sourceColorPalette[
                                                        idx % sourceColorPalette.length
                                                    ].bar
                                                }
                                                style={{ width: `${source.percentage}%` }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {incomeBreakdown.sources.map((source, idx) => (
                                            <div key={source.source} className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="font-medium">
                                                        {source.label}
                                                    </span>
                                                    <span className="text-muted-foreground tabular-nums">
                                                        {formatCurrency(source.amount)}{' '}
                                                        {currencyLabel(
                                                            incomeBreakdown.currency,
                                                        )}{' '}
                                                        · {source.percentage}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={source.percentage}
                                                    className={cn(
                                                        'bg-muted',
                                                        sourceColorPalette[
                                                            idx % sourceColorPalette.length
                                                        ].progress,
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">
                                    لا توجد بيانات دخل هذا الشهر
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card className="shadow-sm xl:col-span-2">
                        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-1.5">
                                <CardTitle>الدخل الشهري</CardTitle>
                                <CardDescription>
                                    مقارنة الدخل والمصروفات خلال آخر 6 أشهر
                                </CardDescription>
                            </div>
                            <ToggleGroup
                                type="single"
                                defaultValue="six-months"
                                className="justify-start"
                            >
                                <ToggleGroupItem value="month">هذا الشهر</ToggleGroupItem>
                                <ToggleGroupItem value="six-months">
                                    آخر 6 أشهر
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={chartConfig}
                                className="min-h-[280px] w-full"
                            >
                                <BarChart accessibilityLayer data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent />}
                                    />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar
                                        dataKey="income"
                                        fill="var(--color-income)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="expenses"
                                        fill="var(--color-expenses)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <CardTitle>يحتاج انتباهك</CardTitle>
                                <CardDescription>
                                    أولويات مالية مقترحة لهذا اليوم
                                </CardDescription>
                            </div>
                            <Bell className="text-muted-foreground" aria-hidden />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {attentionItems.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    لا توجد تنبيهات حالياً
                                </p>
                            ) : (
                                attentionItems.map((item) => {
                                    const Icon =
                                        attentionIconMap[item.type] ?? AlertCircle;

                                    return (
                                        <div
                                            key={item.title}
                                            className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 p-3"
                                        >
                                            <div className="flex min-w-0 gap-3">
                                                <div
                                                    className={cn(
                                                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                                                        attentionClass(
                                                            item.severity as AttentionSeverity,
                                                        ),
                                                    )}
                                                >
                                                    <Icon aria-hidden />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                            {item.type === 'gmail_unlinked' ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="shrink-0"
                                                    asChild
                                                >
                                                    <Link href={emailScannerIndex()}>
                                                        {item.action}
                                                    </Link>
                                                </Button>
                                            ) : item.type === 'renewal_soon' ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="shrink-0"
                                                    onClick={() => {
                                                        if (item.alertId) {
                                                            router.put(renewalAlertDismiss(item.alertId).url);
                                                        }
                                                    }}
                                                >
                                                    {item.action}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="shrink-0"
                                                >
                                                    {item.action}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section
                    aria-label="قسم الوحدات الأساسية"
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                    {[
                        {
                            title: 'روابط الدفع',
                            description:
                                summaryStats && summaryStats.pending_payment_links > 0
                                    ? `${summaryStats.pending_payment_links} مدفوعات معلقة`
                                    : 'لا توجد مدفوعات معلقة',
                            href: paymentLinkIndex(),
                            icon: Link2,
                        },
                        {
                            title: 'العقود والمراحل',
                            description:
                                summaryStats && summaryStats.active_contracts > 0
                                    ? `${summaryStats.active_contracts} عقود نشطة`
                                    : 'لا توجد عقود نشطة',
                            href: contractIndex(),
                            icon: FileText,
                        },
                        {
                            title: 'إدارة الدخل',
                            description:
                                summaryStats && summaryStats.income_entries_this_month > 0
                                    ? `${summaryStats.income_entries_this_month} إدخال هذا الشهر`
                                    : 'لا توجد إدخالات هذا الشهر',
                            href: incomeIndex(),
                            icon: TrendingUp,
                        },
                        {
                            title: 'المصروفات والاشتراكات',
                            description:
                                summaryStats && summaryStats.active_expense_cards > 0
                                    ? `${summaryStats.active_expense_cards} اشتراكات نشطة`
                                    : 'لا توجد اشتراكات نشطة',
                            href: expenseIndex(),
                            icon: TrendingDown,
                        },
                    ].map((item) => (
                        <Card key={item.title} className="shadow-sm">
                            <CardHeader>
                                <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <item.icon aria-hidden />
                                </div>
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription>{item.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href={item.href}>
                                        فتح الوحدة
                                        <ArrowLeft data-icon="inline-end" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'لوحة التحكم',
            href: dashboard(),
        },
    ],
};
