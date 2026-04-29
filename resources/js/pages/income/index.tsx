import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
    AlertTriangleIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    Clock3Icon,
    DownloadIcon,
    FilterIcon,
    Link2Icon,
    PlusIcon,
    SearchIcon,
    WalletIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { create as createIncomePage, index as incomeIndex } from '@/routes/income';
import { create as createPaymentLink } from '@/routes/payment-links';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type IncomeSource = 'payment_link' | 'manual' | 'email_parsed';

type IncomeRow = {
    id: string;
    amount: number;
    currency: 'EGP' | 'USD';
    source: IncomeSource;
    client: string;
    category: string;
    category_key: string;
    date: string;
    description: string;
};

type LaravelPaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: LaravelPaginatorLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export type Filters = {
    month: string;
    source: string;
    category: string;
    search: string;
};

type ChartDataset = {
    currency: string;
    periods: { period: string; value: number }[];
};

export type Outstanding = {
    pending: number;
    overdue: number;
    currency: string | null;
    pending_count: number;
    overdue_count: number;
};

type CategoryOpt = { slug: string; label: string };

export type IncomeIndexProps = {
    filters: Filters;
    monthLabel: string;
    monthTotalsByCurrency: Record<string, number>;
    preferredCurrency: string;
    outstanding: Outstanding;
    chartThisMonthByWeek: ChartDataset;
    chartLastSixMonths: ChartDataset;
    categoryFilterOptions: CategoryOpt[];
    hasAnyIncomeEver: boolean;
    incomeEntries: Paginator<IncomeRow>;
};

const chartConfig = {
    value: { label: 'الإيرادات', color: 'var(--primary)' },
} satisfies ChartConfig;

function formatMoney(amount: number, currency: 'EGP' | 'USD'): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

function shiftMonth(monthYm: string, delta: number): string {
    const [yStr, mStr] = monthYm.split('-');
    const year = Number.parseInt(yStr ?? '0', 10);
    const month = Number.parseInt(mStr ?? '1', 10);
    const d = new Date(year, month - 1 + delta, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}-${mm}`;
}

function sourceBadge(source: IncomeSource) {
    if (source === 'payment_link') {
        return <Badge>رابط دفع</Badge>;
    }

    if (source === 'email_parsed') {
        return (
            <Badge variant="secondary">تحليل بريد</Badge>
        );
    }

    return <Badge variant="outline">يدوي</Badge>;
}

function formatRowDate(dateStr: string): string {
    const d = new Date(`${dateStr}T12:00:00`);
    return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function applyIncomeFilters(base: Filters, partial: Partial<Filters>): void {
    const nextFilters: Filters = {
        month: partial.month ?? base.month,
        source: partial.source ?? base.source,
        category: partial.category ?? base.category,
        search: partial.search ?? base.search ?? '',
    };

    router.get(
        incomeIndex.url({
            query: nextFilters as unknown as Record<string, string>,
        }),
        {},
        { preserveScroll: true },
    );
}

export default function IncomeIndex({
    filters,
    monthLabel,
    monthTotalsByCurrency,
    preferredCurrency,
    outstanding,
    chartThisMonthByWeek,
    chartLastSixMonths,
    categoryFilterOptions,
    hasAnyIncomeEver,
    incomeEntries,
}: IncomeIndexProps) {
    const page = usePage();
    const flash = (page.props as { flash?: { message?: string; type?: string } }).flash;
    const [searchDraft, setSearchDraft] = useState(filters.search ?? '');
    const [chartGranularity, setChartGranularity] = useState<'week' | 'six_months'>('week');

    useEffect(() => {
        setSearchDraft(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if (!flash?.message) {
            return;
        }

        if (flash.type === 'success') {
            toast.success(flash.message);
            return;
        }

        toast.message(flash.message);
    }, [flash?.message, flash?.type]);

    const preferred = (preferredCurrency === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD';
    const earnedPrimary = monthTotalsByCurrency[preferred] ?? 0;

    const otherCurrencyTotals = Object.entries(monthTotalsByCurrency).filter(([c]) => c !== preferred);
    const chartData =
        chartGranularity === 'week' ? chartThisMonthByWeek.periods : chartLastSixMonths.periods;

    const paginationLabel = useMemo(() => {
        if (!incomeEntries.from || !incomeEntries.to || !incomeEntries.total) {
            return '';
        }

        return `${incomeEntries.from}–${incomeEntries.to} من ${incomeEntries.total}`;
    }, [incomeEntries.from, incomeEntries.to, incomeEntries.total]);

    const paginationPrev = incomeEntries.links[0];
    const paginationNext = incomeEntries.links[incomeEntries.links.length - 1];

    if (!hasAnyIncomeEver) {
        return (
            <>
                <Head title="الإيرادات" />
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                    <Card className="bg-muted/30 mx-auto flex min-h-[420px] w-full max-w-3xl items-center justify-center border-dashed">
                        <CardContent className="flex max-w-lg flex-col items-center gap-5 py-16 text-center">
                            <span className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
                                <WalletIcon className="size-10" />
                            </span>
                            <div className="flex flex-col gap-2">
                                <CardTitle className="text-2xl">لا يوجد إيرادات مسجلة بعد</CardTitle>
                                <CardDescription className="text-base">
                                    ابدأ بتنظيم تدفقاتك النقدية عبر إنشاء رابط دفع أو إضافة إيراد يدوي.
                                </CardDescription>
                            </div>
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                                <Button asChild>
                                    <Link href={createPaymentLink()}>
                                        <Link2Icon data-icon="inline-start" />
                                        إنشاء رابط دفع
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={createIncomePage()}>
                                        <PlusIcon data-icon="inline-start" />
                                        إضافة دخل يدوي
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="الإيرادات" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">الإيرادات</h1>
                        <p className="text-muted-foreground">نظرة شاملة على دخلك الحالي والمستحقات القادمة.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild>
                            <Link href={createIncomePage()}>
                                <PlusIcon data-icon="inline-start" />
                                إضافة دخل جديد
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={createPaymentLink()}>
                                <Link2Icon data-icon="inline-start" />
                                إنشاء رابط دفع
                            </Link>
                        </Button>
                    </div>
                </div>

                <section className="grid gap-3 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-primary/10 text-primary mb-2 flex size-8 items-center justify-center rounded-md">
                                <WalletIcon className="size-4" />
                            </div>
                            <CardDescription>إجمالي إيرادات الشهر</CardDescription>
                            <CardTitle>{formatMoney(earnedPrimary, preferred)}</CardTitle>
                            <p className="text-muted-foreground text-sm">{monthLabel}</p>
                            {otherCurrencyTotals.length > 0 ? (
                                <p className="text-muted-foreground text-xs">
                                    {otherCurrencyTotals.map(([curr, amt]) => (
                                        <span key={curr} className="me-2 inline-block">
                                            {curr}: {formatMoney(amt as number, curr === 'USD' ? 'USD' : 'EGP')}
                                        </span>
                                    ))}
                                </p>
                            ) : null}
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-primary/10 text-primary mb-2 flex size-8 items-center justify-center rounded-md">
                                <Clock3Icon className="size-4" />
                            </div>
                            <CardDescription>مبالغ قيد التحصيل</CardDescription>
                            <CardTitle>{formatMoney(outstanding.pending, (outstanding.currency as 'EGP' | 'USD') ?? preferred)}</CardTitle>
                            <p className="text-muted-foreground text-sm">
                                {outstanding.pending_count} فاتورة بانتظار الدفع
                            </p>
                        </CardHeader>
                    </Card>
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="pb-2">
                            <div className="bg-destructive/10 text-destructive mb-2 flex size-8 items-center justify-center rounded-md">
                                <AlertTriangleIcon className="size-4" />
                            </div>
                            <CardDescription className="text-destructive">مستحقات متأخرة</CardDescription>
                            <CardTitle className="text-destructive">
                                {formatMoney(outstanding.overdue, (outstanding.currency as 'EGP' | 'USD') ?? preferred)}
                            </CardTitle>
                            <p className="text-destructive text-sm">
                                {outstanding.overdue_count} فاتورة متجاوزة الموعد
                            </p>
                        </CardHeader>
                    </Card>
                </section>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>نمو الإيرادات</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={chartGranularity === 'week' ? 'outline' : 'ghost'}
                                size="sm"
                                type="button"
                                onClick={() => setChartGranularity('week')}
                            >
                                هذا الشهر
                            </Button>
                            <Button
                                variant={chartGranularity === 'six_months' ? 'outline' : 'ghost'}
                                size="sm"
                                type="button"
                                onClick={() => setChartGranularity('six_months')}
                            >
                                آخر 6 أشهر
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-72 w-full">
                            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={6} fill="var(--color-value)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>سجل الإيرادات</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    title="شهر أقدم"
                                    onClick={() =>
                                        applyIncomeFilters(filters, {
                                            month: shiftMonth(filters.month, -1),
                                        })
                                    }
                                >
                                    <ArrowRightIcon data-icon="inline-start" />
                                </Button>
                                <span className="text-muted-foreground min-w-32 text-center text-sm font-medium">{monthLabel}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    title="شهر أحدث"
                                    onClick={() =>
                                        applyIncomeFilters(filters, {
                                            month: shiftMonth(filters.month, 1),
                                        })
                                    }
                                >
                                    <ArrowLeftIcon data-icon="inline-end" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" type="button">
                                            <DownloadIcon data-icon="inline-start" />
                                            تصدير
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem disabled>تحميل CSV (قريباً)</DropdownMenuItem>
                                            <DropdownMenuItem disabled>تحميل PDF (قريباً)</DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <Input
                                placeholder="بحث في السجل..."
                                className="lg:max-w-sm"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyIncomeFilters(filters, { search: searchDraft });
                                    }
                                }}
                            />
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Select
                                    value={filters.source ?? 'all'}
                                    onValueChange={(value) => applyIncomeFilters(filters, { source: value })}
                                >
                                    <SelectTrigger className="sm:w-44">
                                        <FilterIcon data-icon="inline-start" />
                                        <SelectValue placeholder="المصدر" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">كل المصادر</SelectItem>
                                            <SelectItem value="payment_link">رابط دفع</SelectItem>
                                            <SelectItem value="manual">يدوي</SelectItem>
                                            <SelectItem value="email_parsed">تحليل بريد</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.category ?? 'all'}
                                    onValueChange={(value) => applyIncomeFilters(filters, { category: value })}
                                >
                                    <SelectTrigger className="sm:w-44">
                                        <SearchIcon data-icon="inline-start" />
                                        <SelectValue placeholder="التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">كل التصنيفات</SelectItem>
                                            {categoryFilterOptions.map((opt) => (
                                                <SelectItem key={opt.slug} value={opt.slug}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المبلغ</TableHead>
                                    <TableHead>المصدر</TableHead>
                                    <TableHead>العميل</TableHead>
                                    <TableHead>التصنيف</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incomeEntries.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground text-center py-10">
                                            لا توجد إيرادات مطابقة في هذا الشهر.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incomeEntries.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">
                                                {formatMoney(row.amount, row.currency)}
                                            </TableCell>
                                            <TableCell>{sourceBadge(row.source)}</TableCell>
                                            <TableCell>
                                                <div>{row.client}</div>
                                                {row.description ? (
                                                    <div className="text-muted-foreground text-xs">{row.description}</div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>{row.category}</TableCell>
                                            <TableCell>{formatRowDate(row.date)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span>{paginationLabel}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    disabled={!paginationPrev?.url}
                                    onClick={() => {
                                        const url = paginationPrev?.url;
                                        if (url) {
                                            router.visit(url);
                                        }
                                    }}
                                >
                                    <ArrowRightIcon aria-hidden />
                                </Button>
                                <span>{incomeEntries.current_page} / {incomeEntries.last_page}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    disabled={!paginationNext?.url}
                                    onClick={() => {
                                        const url = paginationNext?.url;
                                        if (url) {
                                            router.visit(url);
                                        }
                                    }}
                                >
                                    <ArrowLeftIcon aria-hidden />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

IncomeIndex.layout = {
    breadcrumbs: [
        {
            title: 'الإيرادات',
            href: incomeIndex(),
        },
    ],
};
