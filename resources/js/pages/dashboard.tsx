import { Head, Link, router } from '@inertiajs/react';
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

const mockUser = {
    name: 'محمد أحمد',
    role: 'مستقل',
};

const mockKpis = [
    {
        label: 'إجمالي دخل هذا الشهر',
        value: 12500,
        helper: '+8.2% عن الشهر السابق',
        icon: DollarSign,
        tone: 'success',
    },
    {
        label: 'المبالغ قيد التحصيل',
        value: 4200,
        helper: '3 روابط دفع مفتوحة',
        icon: Clock3,
        tone: 'warning',
    },
    {
        label: 'المبالغ المتأخرة',
        value: 1800,
        helper: 'تحتاج تذكير اليوم',
        icon: AlertCircle,
        tone: 'danger',
    },
];

const mockPaymentLinks = [
    {
        client: 'سارة للتصميم',
        description: 'هوية بصرية',
        amount: 3500,
        status: 'paid' as PaymentStatus,
        initials: 'س',
    },
    {
        client: 'أحمد علي',
        description: 'تطوير صفحة هبوط',
        amount: 4200,
        status: 'pending' as PaymentStatus,
        initials: 'أ',
    },
    {
        client: 'شركة مدار',
        description: 'استشارة تسويقية',
        amount: 1800,
        status: 'overdue' as PaymentStatus,
        initials: 'م',
    },
    {
        client: 'Nile Apps',
        description: 'صيانة شهرية',
        amount: 3000,
        status: 'paid' as PaymentStatus,
        initials: 'N',
    },
];

const mockRenewals = [
    {
        service: 'Figma Pro',
        amount: 750,
        date: '3 مايو',
        month: 'ماي',
        day: '03',
        daysLeft: 3,
        initials: 'F',
        category: 'تصميم',
        frequency: 'شهري',
    },
    {
        service: 'Notion',
        amount: 480,
        date: '8 مايو',
        month: 'ماي',
        day: '08',
        daysLeft: 8,
        initials: 'N',
        category: 'إنتاجية',
        frequency: 'شهري',
    },
    {
        service: 'Vercel',
        amount: 1000,
        date: '12 مايو',
        month: 'ماي',
        day: '12',
        daysLeft: 12,
        initials: 'V',
        category: 'استضافة',
        frequency: 'شهري',
    },
    {
        service: 'ChatGPT',
        amount: 980,
        date: '18 مايو',
        month: 'ماي',
        day: '18',
        daysLeft: 18,
        initials: 'C',
        category: 'ذكاء اصطناعي',
        frequency: 'شهري',
    },
];

const mockIncomeBreakdown = [
    {
        label: 'روابط الدفع',
        value: 68,
        amount: 8500,
        className: 'bg-success',
        progressClassName: '[&_[data-slot=progress-indicator]]:bg-success',
    },
    {
        label: 'إدخال يدوي',
        value: 22,
        amount: 2750,
        className: 'bg-primary',
        progressClassName: '[&_[data-slot=progress-indicator]]:bg-primary',
    },
    {
        label: 'مستخرج من الإيميل',
        value: 10,
        amount: 1250,
        className: 'bg-warning',
        progressClassName: '[&_[data-slot=progress-indicator]]:bg-warning',
    },
];

const mockChartData = [
    { month: 'نوفمبر', income: 8400, expenses: 1200 },
    { month: 'ديسمبر', income: 9200, expenses: 1650 },
    { month: 'يناير', income: 7800, expenses: 1400 },
    { month: 'فبراير', income: 11100, expenses: 2100 },
    { month: 'مارس', income: 10400, expenses: 1850 },
    { month: 'أبريل', income: 12500, expenses: 2890 },
];

const mockAttentionItems = [
    {
        title: 'رابط دفع متأخر منذ 5 أيام',
        description: 'شركة مدار · 1,800 ج.م',
        action: 'تذكير',
        severity: 'danger' as AttentionSeverity,
        icon: AlertCircle,
    },
    {
        title: 'اشتراك يتجدد خلال 3 أيام',
        description: 'Figma Pro · 750 ج.م',
        action: 'إلغاء',
        severity: 'warning' as AttentionSeverity,
        icon: CalendarClock,
    },
    {
        title: 'Gmail غير مربوط',
        description: 'اربط البريد لاكتشاف الاشتراكات تلقائيًا',
        action: 'ربط',
        severity: 'info' as AttentionSeverity,
        icon: Mail,
    },
    {
        title: '2 اشتراكات بانتظار المراجعة',
        description: 'اكتشفها مساعد الذكاء الاصطناعي',
        action: 'مراجعة',
        severity: 'success' as AttentionSeverity,
        icon: Sparkles,
    },
];

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
}: {
    checklist?: DashboardChecklist;
    walletBalances?: WalletBalanceRow[];
}) {
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
                                {mockUser.role} · مُستحق
                            </Badge>
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-background/70">صباح الخير،</p>
                                <h1
                                    id="dashboard-hero-title"
                                    className="font-display text-3xl font-bold tracking-tight md:text-4xl"
                                >
                                    {mockUser.name}
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-background/70 md:text-base">
                                    ملخص أبريل 2026: راقب الدخل، التحصيل،
                                    الاشتراكات، والمهام المالية المهمة من مكان واحد.
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
                    {mockKpis.map((item) => (
                        <Card key={item.label} className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <CardDescription>{item.label}</CardDescription>
                                    <CardTitle className="text-3xl tabular-nums">
                                        {formatCurrency(item.value)}
                                        <span className="me-1 text-sm font-medium text-muted-foreground">
                                            ج.م
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
                            {mockPaymentLinks.map((item) => (
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
                                            {formatCurrency(item.amount)} ج.م
                                        </span>
                                        <Badge className={statusBadgeClass(item.status)}>
                                            {statusLabel(item.status)}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
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
                            {mockRenewals.map((item, index) => (
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
                                                {item.month}
                                            </span>
                                            <span className="text-sm font-bold tabular-nums">
                                                {item.day}
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
                                                        renewalCategoryClass(item.category),
                                                    )}
                                                >
                                                    {item.category}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.date}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="text-[11px] text-muted-foreground">
                                                {item.frequency}
                                            </p>
                                            <p className="text-sm font-semibold tabular-nums">
                                                {formatCurrency(item.amount)} ج.م
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
                                                        item.daysLeft <= 7 &&
                                                            'font-medium text-warning',
                                                    )}
                                                >
                                                    الدفع القادم خلال {item.daysLeft} أيام
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        'h-8 rounded-lg px-2.5 text-xs',
                                                        renewalReminderActive(item.service) &&
                                                            'border-primary/40 bg-primary/10 text-primary',
                                                    )}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        toggleRenewalReminder(item.service);
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
                            ))}
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
                                <p className="text-sm text-muted-foreground">
                                    إجمالي الدخل
                                </p>
                                <p className="text-3xl font-bold tabular-nums">
                                    {formatCurrency(12500)} ج.م
                                </p>
                            </div>
                            <div
                                className="flex h-3 overflow-hidden rounded-full bg-muted"
                                aria-label="توزيع مصادر الدخل"
                            >
                                {mockIncomeBreakdown.map((item) => (
                                    <div
                                        key={item.label}
                                        className={item.className}
                                        style={{ width: `${item.value}%` }}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col gap-4">
                                {mockIncomeBreakdown.map((item) => (
                                    <div key={item.label} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="font-medium">
                                                {item.label}
                                            </span>
                                            <span className="text-muted-foreground tabular-nums">
                                                {formatCurrency(item.amount)} ج.م ·{' '}
                                                {item.value}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={item.value}
                                            className={cn(
                                                'bg-muted',
                                                item.progressClassName,
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
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
                                <BarChart accessibilityLayer data={mockChartData}>
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
                            {mockAttentionItems.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 p-3"
                                >
                                    <div className="flex min-w-0 gap-3">
                                        <div
                                            className={cn(
                                                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                                                attentionClass(item.severity),
                                            )}
                                        >
                                            <item.icon aria-hidden />
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
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="shrink-0"
                                    >
                                        {item.action}
                                    </Button>
                                </div>
                            ))}
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
                            description: '3 مدفوعات معلقة',
                            href: paymentLinkIndex(),
                            icon: Link2,
                        },
                        {
                            title: 'العقود والمراحل',
                            description: '2 عقود نشطة',
                            href: contractIndex(),
                            icon: FileText,
                        },
                        {
                            title: 'إدارة الدخل',
                            description: '12 إدخال هذا الشهر',
                            href: incomeIndex(),
                            icon: TrendingUp,
                        },
                        {
                            title: 'المصروفات والاشتراكات',
                            description: '6 اشتراكات نشطة',
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
