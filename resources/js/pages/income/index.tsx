import { Head, Link } from '@inertiajs/react';
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
import { create, index } from '@/routes/income';
import { create as createPaymentLink } from '@/routes/payment-links';

type IncomeSource = 'payment_link' | 'manual' | 'email_parsed';

type IncomeRow = {
    id: string;
    amount: number;
    currency: 'EGP' | 'USD';
    source: IncomeSource;
    client: string;
    category: string;
    date: string;
    description: string;
    isOverdue?: boolean;
};

const monthlyChart = [
    { period: 'يناير', value: 20000 },
    { period: 'فبراير', value: 30000 },
    { period: 'مارس', value: 22000 },
    { period: 'أبريل', value: 40000 },
    { period: 'مايو', value: 45000 },
];

const demoRows: IncomeRow[] = [
    {
        id: 'inc_001',
        amount: 15000,
        currency: 'EGP',
        source: 'payment_link',
        client: 'شركة الأفق الحديث',
        category: 'خدمات تصميم',
        date: '15 مايو 2024',
        description: 'تصميم موقع إلكتروني',
    },
    {
        id: 'inc_002',
        amount: 8500,
        currency: 'EGP',
        source: 'manual',
        client: 'أحمد محمود',
        category: 'استشارات',
        date: '12 مايو 2024',
        description: 'استشارة تسويقية',
    },
    {
        id: 'inc_003',
        amount: 21500,
        currency: 'EGP',
        source: 'email_parsed',
        client: 'مؤسسة النور',
        category: 'برمجة وتطوير',
        date: '08 مايو 2024',
        description: 'تطوير تطبيق جوال - الدفعة الثانية',
    },
    {
        id: 'inc_004',
        amount: 5500,
        currency: 'EGP',
        source: 'payment_link',
        client: 'سارة كامل',
        category: 'خدمات تصميم',
        date: '01 مايو 2024',
        description: 'مستحق متأخر',
        isOverdue: true,
    },
];

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

function sourceBadge(source: IncomeSource) {
    if (source === 'payment_link') {
        return <Badge>رابط دفع</Badge>;
    }
    if (source === 'email_parsed') {
        return <Badge variant="secondary">تحليل بريد</Badge>;
    }
    return <Badge variant="outline">يدوي</Badge>;
}

export default function IncomeIndex() {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isEmpty = params.get('empty') === '1';
    const incomeRows = isEmpty ? [] : demoRows;

    return (
        <>
            <Head title="الإيرادات" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                {isEmpty ? (
                    <Card className="bg-muted/30 mx-auto flex min-h-[420px] w-full max-w-3xl items-center justify-center border-dashed">
                        <CardContent className="flex max-w-lg flex-col items-center gap-5 py-16 text-center">
                            <span className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
                                <WalletIcon className="size-10" />
                            </span>
                            <div className="space-y-2">
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
                                    <Link href={create()}>
                                        <PlusIcon data-icon="inline-start" />
                                        إضافة دخل يدوي
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold">الإيرادات</h1>
                                <p className="text-muted-foreground">نظرة شاملة على دخلك الحالي والمستحقات القادمة.</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button asChild>
                                    <Link href={create()}>
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
                                    <CardTitle>{formatMoney(45000, 'EGP')}</CardTitle>
                                    <p className="text-sm text-emerald-600">+12% عن الشهر الماضي</p>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="bg-primary/10 text-primary mb-2 flex size-8 items-center justify-center rounded-md">
                                        <Clock3Icon className="size-4" />
                                    </div>
                                    <CardDescription>مبالغ قيد التحصيل</CardDescription>
                                    <CardTitle>{formatMoney(12000, 'EGP')}</CardTitle>
                                    <p className="text-muted-foreground text-sm">3 فواتير بانتظار الدفع</p>
                                </CardHeader>
                            </Card>
                            <Card className="border-destructive/30 bg-destructive/5">
                                <CardHeader className="pb-2">
                                    <div className="bg-destructive/10 text-destructive mb-2 flex size-8 items-center justify-center rounded-md">
                                        <AlertTriangleIcon className="size-4" />
                                    </div>
                                    <CardDescription className="text-destructive">مستحقات متأخرة</CardDescription>
                                    <CardTitle className="text-destructive">{formatMoney(5500, 'EGP')}</CardTitle>
                                    <p className="text-destructive text-sm">فاتورة واحدة متجاوزة الموعد</p>
                                </CardHeader>
                            </Card>
                        </section>

                        <Card>
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle>نمو الإيرادات</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">شهري</Button>
                                    <Button variant="ghost" size="sm">أسبوعي</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-72 w-full">
                                    <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                            <ArrowRightIcon data-icon="inline-start" />
                                            مايو 2024
                                            <ArrowLeftIcon data-icon="inline-end" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <DownloadIcon data-icon="inline-start" />
                                                    تصدير
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem>تحميل CSV</DropdownMenuItem>
                                                    <DropdownMenuItem>تحميل PDF</DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <Input placeholder="بحث في السجل..." className="lg:max-w-sm" />
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Select defaultValue="all">
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
                                        <Select defaultValue="all">
                                            <SelectTrigger className="sm:w-44">
                                                <SearchIcon data-icon="inline-start" />
                                                <SelectValue placeholder="التصنيف" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="all">كل التصنيفات</SelectItem>
                                                    <SelectItem value="design">خدمات تصميم</SelectItem>
                                                    <SelectItem value="consulting">استشارات</SelectItem>
                                                    <SelectItem value="development">برمجة وتطوير</SelectItem>
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
                                        {incomeRows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="font-medium">
                                                    {formatMoney(row.amount, row.currency)}
                                                </TableCell>
                                                <TableCell>{sourceBadge(row.source)}</TableCell>
                                                <TableCell>
                                                    <div>{row.client}</div>
                                                    <div className={row.isOverdue ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
                                                        {row.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{row.category}</TableCell>
                                                <TableCell>{row.date}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-sm">
                                    <Button variant="outline" size="icon" disabled>
                                        <ArrowRightIcon />
                                    </Button>
                                    1 من 5
                                    <Button variant="outline" size="icon">
                                        <ArrowLeftIcon />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

IncomeIndex.layout = {
    breadcrumbs: [
        {
            title: 'الإيرادات',
            href: index(),
        },
    ],
};
