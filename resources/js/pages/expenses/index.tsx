import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    EllipsisVerticalIcon,
    ExternalLinkIcon,
    Loader2Icon,
    PlusIcon,
    RefreshCwIcon,
    ScanSearchIcon,
    SparklesIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { create, destroy, edit, fetchCancelInstructions, index, status } from '@/routes/expenses';
import { index as emailScannerIndex } from '@/routes/email-scanner';
import { toast } from 'sonner';

type ExpenseStatus = 'active' | 'paused' | 'cancelled';
type ExpenseCategory = 'saas' | 'tool' | 'equipment' | 'marketing' | 'other';
type BillingCycle = 'monthly' | 'annual' | 'one-time';
type Confidence = 'high' | 'medium' | 'low';

export type ExpenseCardRow = {
    id: string;
    name: string;
    amount: number;
    currency: 'EGP' | 'USD';
    status: ExpenseStatus;
    category: ExpenseCategory;
    type: 'recurring' | 'one-time';
    billingCycle: BillingCycle;
    nextRenewalDate: string | null;
    autoDetected: boolean;
    cancelUrl: string | null;
    cancelInstructions: string | null;
    notes: string;
};

export type ExpenseFilters = {
    status: string;
    category: string;
    billing_cycle: string;
    search: string;
    sort: string;
};

type ExpenseSummary = {
    preferred_currency: 'EGP' | 'USD';
    monthly_burn: number;
    annual_commitment: number;
    by_currency: {
        currency: string;
        monthly_burn: number;
        annual_commitment: number;
    }[];
};

type ExpensesIndexProps = {
    filters: ExpenseFilters;
    preferredCurrency: 'EGP' | 'USD';
    summary: ExpenseSummary;
    hasAnyExpenseEver: boolean;
    expenses: ExpenseCardRow[];
};

type FetchResult = {
    cancelUrl: string | null;
    cancelInstructions: string | null;
    confidence: Confidence;
};

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
    }).format(new Date(`${value}T12:00:00`));
}

function daysUntil(date: string | null): number | null {
    if (!date) {
        return null;
    }

    const now = new Date();
    const diff = new Date(`${date}T12:00:00`).setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function applyExpenseFilters(base: ExpenseFilters, partial: Partial<ExpenseFilters>): void {
    const next: ExpenseFilters = {
        status: partial.status ?? base.status,
        category: partial.category ?? base.category,
        billing_cycle: partial.billing_cycle ?? base.billing_cycle,
        search: partial.search ?? base.search ?? '',
        sort: partial.sort ?? base.sort,
    };

    router.get(
        index.url({
            query: next as unknown as Record<string, string>,
        }),
        {},
        { preserveScroll: true },
    );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
    if (confidence === 'high') {
        return (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                ثقة عالية
            </Badge>
        );
    }
    if (confidence === 'medium') {
        return (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                ثقة متوسطة
            </Badge>
        );
    }
    return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            ثقة منخفضة
        </Badge>
    );
}

export default function ExpensesIndex({
    filters,
    preferredCurrency,
    summary,
    hasAnyExpenseEver,
    expenses: initialExpenses,
}: ExpensesIndexProps) {
    const page = usePage();
    const flash = (page.props as { flash?: { message?: string; type?: string } }).flash;

    const [searchDraft, setSearchDraft] = useState(filters.search ?? '');
    const [expenses, setExpenses] = useState<ExpenseCardRow[]>(initialExpenses);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseCardRow | null>(null);
    const [statusSaving, setStatusSaving] = useState(false);
    const [fetchingInstructions, setFetchingInstructions] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [fetchedConfidence, setFetchedConfidence] = useState<Confidence | null>(null);

    useEffect(() => {
        setExpenses(initialExpenses);
    }, [initialExpenses]);

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

    useEffect(() => {
        setFetchError(null);
        setFetchedConfidence(null);
    }, [selectedExpense?.id]);

    const otherCurrencyRows = summary.by_currency.filter(
        (row) =>
            row.currency !== preferredCurrency &&
            (row.monthly_burn > 0 || row.annual_commitment > 0),
    );

    const statusBadge = (s: ExpenseStatus) => {
        if (s === 'active') {
            return <Badge>نشط</Badge>;
        }
        if (s === 'paused') {
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

    function applyFetchResult(expenseId: string, result: FetchResult): void {
        const updater = (card: ExpenseCardRow): ExpenseCardRow =>
            card.id === expenseId
                ? {
                      ...card,
                      cancelUrl: result.cancelUrl ?? card.cancelUrl,
                      cancelInstructions: result.cancelInstructions,
                  }
                : card;

        setExpenses((prev) => prev.map(updater));
        setSelectedExpense((prev) => (prev ? updater(prev) : null));
        setFetchedConfidence(result.confidence);
    }

    function fetchInstructions(expenseId: string): void {
        setFetchingInstructions(true);
        setFetchError(null);
        setFetchedConfidence(null);

        fetch(fetchCancelInstructions.url({ expense: expenseId }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                        ?.content ?? '',
                Accept: 'application/json',
            },
        })
            .then(async (res) => {
                const data = (await res.json()) as
                    | FetchResult
                    | { error: string };

                if (!res.ok) {
                    setFetchError(
                        'error' in data
                            ? data.error
                            : 'تعذّر جلب التعليمات. حاول مرة أخرى أو ابحث يدويًا.',
                    );
                    return;
                }

                applyFetchResult(expenseId, data as FetchResult);
            })
            .catch(() => {
                setFetchError('تعذّر جلب التعليمات. حاول مرة أخرى أو ابحث يدويًا.');
            })
            .finally(() => {
                setFetchingInstructions(false);
            });
    }

    function confirmCancellation(): void {
        if (!selectedExpense) {
            return;
        }
        setStatusSaving(true);
        router.patch(
            status.url({ expense: selectedExpense.id }),
            { status: 'cancelled' },
            {
                preserveScroll: true,
                onFinish: () => setStatusSaving(false),
                onSuccess: () => setSelectedExpense(null),
            },
        );
    }

    function reactivateExpense(id: string): void {
        router.patch(status.url({ expense: id }), { status: 'active' }, { preserveScroll: true });
    }

    function deleteExpense(id: string): void {
        if (!window.confirm('حذف بطاقة المصروف نهائيًا؟')) {
            return;
        }
        router.delete(destroy.url({ expense: id }), { preserveScroll: true });
    }

    const noCardsAtAll = !hasAnyExpenseEver && expenses.length === 0;
    const filteredEmpty = hasAnyExpenseEver && expenses.length === 0;

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
                            <CardTitle>
                                {formatMoney(summary.monthly_burn, preferredCurrency)}
                            </CardTitle>
                            {otherCurrencyRows.map((row) =>
                                row.monthly_burn > 0 ? (
                                    <CardDescription key={`mb-${row.currency}`} className="text-xs">
                                        {formatMoney(row.monthly_burn, row.currency as 'EGP' | 'USD')}
                                    </CardDescription>
                                ) : null,
                            )}
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>إجمالي الالتزام السنوي</CardDescription>
                            <CardTitle>
                                {formatMoney(summary.annual_commitment, preferredCurrency)}
                            </CardTitle>
                            {otherCurrencyRows.map((row) =>
                                row.annual_commitment > 0 ? (
                                    <CardDescription key={`ac-${row.currency}`} className="text-xs">
                                        {formatMoney(
                                            row.annual_commitment,
                                            row.currency as 'EGP' | 'USD',
                                        )}
                                    </CardDescription>
                                ) : null,
                            )}
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-3">
                            <Input
                                placeholder="ابحث باسم الخدمة..."
                                value={searchDraft}
                                onChange={(event) => setSearchDraft(event.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyExpenseFilters(filters, { search: searchDraft });
                                    }
                                }}
                            />
                            <div className="grid gap-3 md:grid-cols-4">
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => applyExpenseFilters(filters, { status: value })}
                                >
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

                                <Select
                                    value={filters.category}
                                    onValueChange={(value) => applyExpenseFilters(filters, { category: value })}
                                >
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

                                <Select
                                    value={filters.billing_cycle}
                                    onValueChange={(value) =>
                                        applyExpenseFilters(filters, { billing_cycle: value })
                                    }
                                >
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

                                <Select
                                    value={filters.sort}
                                    onValueChange={(value) => applyExpenseFilters(filters, { sort: value })}
                                >
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

                {noCardsAtAll ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                            <TriangleAlertIcon className="text-muted-foreground" />
                            <p className="text-muted-foreground">لا توجد مصروفات مسجّلة بعد.</p>
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
                ) : filteredEmpty ? (
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
                        {expenses.map((expense) => (
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
                                                    {formatMoney(expense.amount, expense.currency)} /{' '}
                                                    {expense.billingCycle === 'monthly'
                                                        ? 'شهر'
                                                        : expense.billingCycle === 'annual'
                                                          ? 'سنة'
                                                          : 'مرة'}
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
                                                        <Link href={edit({ expense: expense.id })}>تعديل</Link>
                                                    </DropdownMenuItem>
                                                    {expense.status !== 'cancelled' ? (
                                                        <DropdownMenuItem
                                                            onClick={() => setSelectedExpense(expense)}
                                                        >
                                                            إلغاء الاشتراك
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    {expense.status !== 'active' ? (
                                                        <DropdownMenuItem
                                                            onClick={() => reactivateExpense(expense.id)}
                                                        >
                                                            إعادة تفعيل
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => deleteExpense(expense.id)}
                                                    >
                                                        حذف
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {statusBadge(expense.status)}
                                        {expense.autoDetected ? (
                                            <Badge variant="secondary">مكتشف تلقائيًا</Badge>
                                        ) : null}
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
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {selectedExpense ? `إلغاء ${selectedExpense.name}` : 'إلغاء الاشتراك'}
                        </SheetTitle>
                        <SheetDescription>اتبع الخطوات ثم أكد الإلغاء بعد الانتهاء.</SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 flex flex-col gap-4 text-sm">
                        {fetchingInstructions ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
                                <p className="text-muted-foreground text-xs">
                                    جارٍ جلب تعليمات الإلغاء من الذكاء الاصطناعي…
                                </p>
                            </div>
                        ) : selectedExpense?.cancelInstructions ? (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="text-muted-foreground size-4" />
                                        <span className="text-muted-foreground text-xs">تعليمات الإلغاء</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {fetchedConfidence ? (
                                            <ConfidenceBadge confidence={fetchedConfidence} />
                                        ) : null}
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline underline-offset-2 transition-colors"
                                            disabled={fetchingInstructions}
                                            onClick={() => selectedExpense && fetchInstructions(selectedExpense.id)}
                                        >
                                            <RefreshCwIcon className="size-3" />
                                            تحديث
                                        </button>
                                    </div>
                                </div>

                                {selectedExpense.cancelUrl ? (
                                    <div className="bg-muted rounded-lg p-3">
                                        <p className="mb-1 font-medium">رابط الإلغاء</p>
                                        <a
                                            href={selectedExpense.cancelUrl}
                                            className="text-primary flex items-center gap-1 text-xs underline underline-offset-2"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {selectedExpense.cancelUrl}
                                            <ExternalLinkIcon className="size-3 shrink-0" />
                                        </a>
                                    </div>
                                ) : null}

                                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&_ol]:list-decimal [&_ol]:ps-4 [&_blockquote]:rounded-md [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:p-3 [&_blockquote]:text-amber-900 dark:[&_blockquote]:bg-amber-950 dark:[&_blockquote]:text-amber-100">
                                    <ReactMarkdown>
                                        {selectedExpense.cancelInstructions}
                                    </ReactMarkdown>
                                </div>
                            </>
                        ) : (
                            <div className="bg-muted rounded-lg p-4">
                                {fetchError ? (
                                    <>
                                        <p className="text-destructive mb-3 text-xs">{fetchError}</p>
                                        {selectedExpense ? (
                                            <a
                                                href={`https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(selectedExpense.name)}+subscription`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary text-xs underline underline-offset-2"
                                            >
                                                ابحث على Google عن طريقة الإلغاء ←
                                            </a>
                                        ) : null}
                                        <Button
                                            variant="outline"
                                            className="mt-3 w-full"
                                            type="button"
                                            onClick={() => selectedExpense && fetchInstructions(selectedExpense.id)}
                                        >
                                            <SparklesIcon data-icon="inline-start" />
                                            إعادة المحاولة
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="mb-3">لا توجد تعليمات إلغاء محفوظة لهذه الخدمة بعد.</p>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            type="button"
                                            onClick={() => selectedExpense && fetchInstructions(selectedExpense.id)}
                                        >
                                            <SparklesIcon data-icon="inline-start" />
                                            جلب تعليمات الإلغاء ←
                                        </Button>
                                    </>
                                )}
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
                        <Button
                            variant="destructive"
                            type="button"
                            disabled={statusSaving}
                            onClick={() => confirmCancellation()}
                        >
                            تأكيد الإلغاء
                        </Button>
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
