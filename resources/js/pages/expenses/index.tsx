import { Head, Link } from '@inertiajs/react';
import { EllipsisVerticalIcon, Link2Icon, PlusIcon, ScanSearchIcon, TriangleAlertIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { create, edit, index } from '@/routes/expenses';
import { index as emailScannerIndex } from '@/routes/email-scanner';

type ExpenseStatus = 'active' | 'paused' | 'cancelled';
type ExpenseCategory = 'saas' | 'tool' | 'equipment' | 'marketing' | 'other';
type BillingCycle = 'monthly' | 'annual' | 'one-time';

type ExpenseCard = {
    id: string;
    name: string;
    amount: number;
    currency: 'EGP' | 'USD';
    status: ExpenseStatus;
    category: ExpenseCategory;
    billingCycle: BillingCycle;
    nextRenewalDate: string | null;
    autoDetected: boolean;
    cancelUrl: string | null;
    cancelInstructions: string[];
    note: string;
};

const MOCK_EXPENSES: ExpenseCard[] = [
    {
        id: 'exp_001',
        name: 'Figma Pro',
        amount: 15,
        currency: 'USD',
        status: 'active',
        category: 'saas',
        billingCycle: 'monthly',
        nextRenewalDate: '2026-05-03',
        autoDetected: true,
        cancelUrl: 'https://www.figma.com/account/billing/',
        cancelInstructions: ['افتح صفحة Billing.', 'اختر Manage Plan.', 'اضغط Cancel plan ثم أكد الإلغاء.'],
        note: 'الإلغاء في منتصف الدورة لا يعيد المبلغ.',
    },
    {
        id: 'exp_002',
        name: 'Notion Plus',
        amount: 120,
        currency: 'USD',
        status: 'active',
        category: 'saas',
        billingCycle: 'annual',
        nextRenewalDate: '2026-06-18',
        autoDetected: false,
        cancelUrl: null,
        cancelInstructions: [],
        note: '',
    },
    {
        id: 'exp_003',
        name: 'Meta Ads',
        amount: 3200,
        currency: 'EGP',
        status: 'paused',
        category: 'marketing',
        billingCycle: 'monthly',
        nextRenewalDate: '2026-05-10',
        autoDetected: false,
        cancelUrl: null,
        cancelInstructions: [],
        note: '',
    },
    {
        id: 'exp_004',
        name: 'Adobe Creative Cloud',
        amount: 29.99,
        currency: 'USD',
        status: 'cancelled',
        category: 'saas',
        billingCycle: 'monthly',
        nextRenewalDate: null,
        autoDetected: true,
        cancelUrl: 'https://account.adobe.com/plans',
        cancelInstructions: ['اذهب إلى Plans.', 'اختر Manage plan.', 'اختر Cancel your plan.'],
        note: '',
    },
];

function formatMoney(amount: number, currency: 'EGP' | 'USD'): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatRenewalDate(value: string | null): string {
    if (!value) {
        return 'تاريخ التجديد غير معروف';
    }

    return new Intl.DateTimeFormat('ar-EG', {
        month: 'long',
        day: 'numeric',
    }).format(new Date(value));
}

function daysUntil(date: string | null): number | null {
    if (!date) {
        return null;
    }

    const now = new Date();
    const diff = new Date(date).setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function ExpensesIndex() {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
    const [cycleFilter, setCycleFilter] = useState<'all' | BillingCycle>('all');
    const [sortBy, setSortBy] = useState<'renewal' | 'amount' | 'name'>('renewal');
    const [selectedExpense, setSelectedExpense] = useState<ExpenseCard | null>(null);

    const monthlyBurn = useMemo(() => {
        return MOCK_EXPENSES.filter((expense) => expense.status === 'active')
            .filter((expense) => expense.billingCycle !== 'one-time')
            .reduce((sum, expense) => {
                if (expense.billingCycle === 'annual') {
                    return sum + expense.amount / 12;
                }

                return sum + expense.amount;
            }, 0);
    }, []);

    const annualCommitment = useMemo(() => {
        return MOCK_EXPENSES.filter((expense) => expense.status === 'active')
            .filter((expense) => expense.billingCycle !== 'one-time')
            .reduce((sum, expense) => {
                if (expense.billingCycle === 'annual') {
                    return sum + expense.amount;
                }

                return sum + expense.amount * 12;
            }, 0);
    }, []);

    const filteredExpenses = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const result = MOCK_EXPENSES.filter((expense) => {
            if (statusFilter !== 'all' && expense.status !== statusFilter) {
                return false;
            }

            if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
                return false;
            }

            if (cycleFilter !== 'all' && expense.billingCycle !== cycleFilter) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            return expense.name.toLowerCase().includes(normalizedQuery);
        });

        return result.sort((a, b) => {
            if (sortBy === 'amount') {
                return b.amount - a.amount;
            }

            if (sortBy === 'name') {
                return a.name.localeCompare(b.name, 'ar');
            }

            const aDate = a.nextRenewalDate ? new Date(a.nextRenewalDate).getTime() : Number.MAX_SAFE_INTEGER;
            const bDate = b.nextRenewalDate ? new Date(b.nextRenewalDate).getTime() : Number.MAX_SAFE_INTEGER;
            return aDate - bDate;
        });
    }, [categoryFilter, cycleFilter, query, sortBy, statusFilter]);

    const statusBadge = (status: ExpenseStatus) => {
        if (status === 'active') {
            return <Badge>نشط</Badge>;
        }
        if (status === 'paused') {
            return <Badge variant="secondary">متوقف مؤقتًا</Badge>;
        }
        return <Badge variant="outline">ملغي</Badge>;
    };

    const renewalTone = (nextRenewalDate: string | null) => {
        const remaining = daysUntil(nextRenewalDate);
        if (remaining === null) {
            return 'text-muted-foreground';
        }
        if (remaining < 0) {
            return 'text-destructive';
        }
        if (remaining <= 7) {
            return 'text-amber-600';
        }
        return 'text-muted-foreground';
    };

    return (
        <>
            <Head title="المصروفات" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>المصروفات</CardTitle>
                            <CardDescription>
                                إدارة اشتراكاتك ومصروفات العمل مع تنبيهات التجديد.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline">
                                <Link href={emailScannerIndex()}>
                                    <ScanSearchIcon data-icon="inline-start" />
                                    فحص الاشتراكات
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={create()}>
                                    <PlusIcon data-icon="inline-start" />
                                    إضافة مصروف
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>إجمالي الحرق الشهري</CardDescription>
                            <CardTitle>{formatMoney(monthlyBurn, 'EGP')}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>إجمالي الالتزام السنوي</CardDescription>
                            <CardTitle>{formatMoney(annualCommitment, 'EGP')}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-3">
                            <Input
                                placeholder="ابحث باسم الخدمة..."
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                            <div className="grid gap-3 md:grid-cols-4">
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | ExpenseStatus)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="الحالة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">كل الحالات</SelectItem>
                                            <SelectItem value="active">نشط</SelectItem>
                                            <SelectItem value="paused">متوقف</SelectItem>
                                            <SelectItem value="cancelled">ملغي</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as 'all' | ExpenseCategory)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">كل التصنيفات</SelectItem>
                                            <SelectItem value="saas">SaaS</SelectItem>
                                            <SelectItem value="tool">أداة</SelectItem>
                                            <SelectItem value="equipment">معدات</SelectItem>
                                            <SelectItem value="marketing">تسويق</SelectItem>
                                            <SelectItem value="other">أخرى</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                <Select value={cycleFilter} onValueChange={(value) => setCycleFilter(value as 'all' | BillingCycle)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="دورة الفوترة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">كل الدورات</SelectItem>
                                            <SelectItem value="monthly">شهري</SelectItem>
                                            <SelectItem value="annual">سنوي</SelectItem>
                                            <SelectItem value="one-time">مرة واحدة</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'renewal' | 'amount' | 'name')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="الترتيب" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="renewal">الأقرب تجديدًا</SelectItem>
                                            <SelectItem value="amount">الأعلى مبلغًا</SelectItem>
                                            <SelectItem value="name">الاسم (أ-ي)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {filteredExpenses.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                            <TriangleAlertIcon className="text-muted-foreground" />
                            <p className="text-muted-foreground">لا توجد مصروفات مطابقة للفلاتر الحالية.</p>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild>
                                    <Link href={create()}>إضافة مصروف يدوي</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={emailScannerIndex()}>فحص بريدي الإلكتروني</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredExpenses.map((expense) => (
                            <Card key={expense.id} className={expense.status === 'cancelled' ? 'opacity-65' : undefined}>
                                <CardHeader className="gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3">
                                            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg text-xs font-semibold">
                                                {expense.name.charAt(0)}
                                            </span>
                                            <div className="flex flex-col gap-1">
                                                <CardTitle className="text-base">{expense.name}</CardTitle>
                                                <CardDescription>
                                                    {formatMoney(expense.amount, expense.currency)} / {expense.billingCycle === 'monthly' ? 'شهر' : expense.billingCycle === 'annual' ? 'سنة' : 'مرة'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" aria-label="خيارات البطاقة">
                                                    <EllipsisVerticalIcon />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={edit(expense.id)}>تعديل</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSelectedExpense(expense)}>
                                                        إلغاء الاشتراك
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        إعادة تفعيل
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {statusBadge(expense.status)}
                                        {expense.autoDetected ? <Badge variant="secondary">مكتشف تلقائيًا</Badge> : null}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className={`text-sm ${renewalTone(expense.nextRenewalDate)}`}>
                                        التجديد: {formatRenewalDate(expense.nextRenewalDate)}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Sheet open={selectedExpense !== null} onOpenChange={(isOpen) => !isOpen && setSelectedExpense(null)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {selectedExpense ? `إلغاء ${selectedExpense.name}` : 'إلغاء الاشتراك'}
                        </SheetTitle>
                        <SheetDescription>
                            اتبع الخطوات ثم أكد الإلغاء بعد الانتهاء.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 flex flex-col gap-4 text-sm">
                        {selectedExpense?.cancelInstructions.length ? (
                            <>
                                <div className="bg-muted rounded-lg p-3">
                                    <p className="font-medium">رابط الإلغاء</p>
                                    {selectedExpense.cancelUrl ? (
                                        <a href={selectedExpense.cancelUrl} className="text-primary text-xs underline underline-offset-2" target="_blank" rel="noreferrer">
                                            {selectedExpense.cancelUrl}
                                        </a>
                                    ) : (
                                        <p className="text-muted-foreground text-xs">غير متوفر</p>
                                    )}
                                </div>
                                <ol className="list-inside list-decimal space-y-1">
                                    {selectedExpense.cancelInstructions.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ol>
                                {selectedExpense.note ? (
                                    <p className="text-muted-foreground text-xs">{selectedExpense.note}</p>
                                ) : null}
                            </>
                        ) : (
                            <div className="bg-muted rounded-lg p-4">
                                <p className="mb-3">لا توجد تعليمات إلغاء محفوظة لهذه الخدمة بعد.</p>
                                <Button variant="outline" className="w-full">
                                    <Link2Icon data-icon="inline-start" />
                                    جلب تعليمات الإلغاء
                                </Button>
                            </div>
                        )}

                        <Separator />

                        <div className="flex flex-col gap-2">
                            <Label>هل قمت بإلغاء الاشتراك بالفعل؟</Label>
                            <p className="text-muted-foreground text-xs">
                                بعد التأكيد سيتم تغيير الحالة إلى "ملغي" على لوحة المصروفات.
                            </p>
                        </div>
                    </div>

                    <SheetFooter className="mt-8 gap-2 sm:flex-col sm:items-stretch">
                        <Button variant="destructive">تأكيد الإلغاء</Button>
                        <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                            إغلاق
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}

ExpensesIndex.layout = {
    breadcrumbs: [
        {
            title: 'المصروفات',
            href: index(),
        },
    ],
};
