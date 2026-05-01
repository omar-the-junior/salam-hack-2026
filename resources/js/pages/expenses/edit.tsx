import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRightIcon, CalendarDaysIcon, ChevronDownIcon, SaveIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    compareExpenseYmd,
    EXPENSE_DATE_ORDER_MESSAGE_AR,
    formatDateToYmd,
    formatOptionalExpenseDateLabel,
    parseYmdToDate,
} from '@/lib/expense-form-dates';
import { index, update } from '@/routes/expenses';

type ExpenseEditPayload = {
    id: string;
    name: string;
    amount: number;
    currency: 'EGP' | 'USD';
    status: 'active' | 'paused' | 'cancelled';
    category: string;
    type: 'recurring' | 'one-time';
    billingCycle: string;
    nextRenewalDate: string | null;
    autoDetected: boolean;
    cancelUrl: string | null;
    cancelInstructions: string[];
    notes: string;
    startedAt: string;
    alertDaysBefore: number;
};

type Props = {
    expense: ExpenseEditPayload;
};

type FormValues = {
    name: string;
    category: string;
    type: 'recurring' | 'one-time';
    amount: string;
    currency: 'EGP' | 'USD';
    billing_cycle: string;
    next_renewal_date: string;
    started_at: string;
    alert_days_before: string;
    cancel_url: string;
    notes: string;
};

function FieldRow({ children }: { children: ReactNode }): ReactElement {
    return <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start">{children}</div>;
}

export default function ExpensesEdit({ expense }: Props) {
    const [startedPopoverOpen, setStartedPopoverOpen] = useState(false);
    const [renewalPopoverOpen, setRenewalPopoverOpen] = useState(false);
    const [optionalSectionOpen, setOptionalSectionOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm<FormValues>({
        name: expense.name,
        category: expense.category,
        type: expense.type,
        amount: String(expense.amount),
        currency: expense.currency,
        billing_cycle: expense.billingCycle,
        next_renewal_date: expense.nextRenewalDate ?? '',
        started_at: expense.startedAt ?? '',
        alert_days_before: String(expense.alertDaysBefore ?? 7),
        cancel_url: expense.cancelUrl ?? '',
        notes: expense.notes ?? '',
    });

    const dateOrderClientError = useMemo(() => {
        const started = data.started_at.trim();
        const renewal = data.next_renewal_date.trim();

        if (!started || !renewal) {
            return undefined;
        }

        if (compareExpenseYmd(renewal, started) < 0) {
            return EXPENSE_DATE_ORDER_MESSAGE_AR;
        }

        return undefined;
    }, [data.started_at, data.next_renewal_date]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();

        if (dateOrderClientError) {
            return;
        }

        put(update.url({ expense: expense.id }));
    }

    const nextRenewalDisplayError = errors.next_renewal_date ?? dateOrderClientError;

    const statusLabel =
        expense.status === 'active' ? 'نشط' : expense.status === 'paused' ? 'متوقف' : 'ملغي';

    const optionalFieldsHaveErrors = errors.cancel_url !== undefined || errors.notes !== undefined;
    const optionalCollapsibleOpen = optionalSectionOpen || optionalFieldsHaveErrors;

    return (
        <>
            <Head title="تعديل مصروف" />
            <div className="bg-surface min-h-svh">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
                    <div className="flex flex-col gap-2">
                        <Button asChild variant="ghost" className="w-fit px-2">
                            <Link href={index()}>
                                <ArrowRightIcon data-icon="inline-start" />
                                عودة إلى المصروفات
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">تعديل المصروف</h1>
                        <p className="text-muted-foreground max-w-2xl text-sm">
                            قم بتحديث بيانات المصروف أو معلومات التجديد عند الحاجة.
                        </p>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
                        <Card className="shadow-sm">
                            <CardHeader className="text-right">
                                <CardTitle>البيانات الأساسية</CardTitle>
                                <CardDescription>{expense.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">اسم الخدمة أو المصروف</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        aria-invalid={errors.name !== undefined}
                                        className="min-h-11"
                                    />
                                    {errors.name ? <p className="text-destructive text-sm">{errors.name}</p> : null}
                                </div>

                                <FieldRow>
                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="category">التصنيف</Label>
                                        <Select
                                            value={data.category}
                                            onValueChange={(value) => setData('category', value)}
                                        >
                                            <SelectTrigger id="category" aria-invalid={errors.category !== undefined}>
                                                <SelectValue placeholder="اختر التصنيف" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="saas">SaaS</SelectItem>
                                                    <SelectItem value="tool">أداة</SelectItem>
                                                    <SelectItem value="equipment">معدات</SelectItem>
                                                    <SelectItem value="marketing">تسويق</SelectItem>
                                                    <SelectItem value="other">أخرى</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.category ? (
                                            <p className="text-destructive text-sm">{errors.category}</p>
                                        ) : null}
                                    </div>
                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="type">نوع المصروف</Label>
                                        <Select
                                            value={data.type}
                                            onValueChange={(value) => {
                                                const t = value as FormValues['type'];
                                                setData('type', t);

                                                if (t === 'one-time') {
                                                    setData('billing_cycle', 'one-time');
                                                    setData('next_renewal_date', '');
                                                    setRenewalPopoverOpen(false);
                                                } else {
                                                    setData('billing_cycle', 'monthly');
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="type" aria-invalid={errors.type !== undefined}>
                                                <SelectValue placeholder="اختر النوع" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="recurring">متكرر</SelectItem>
                                                    <SelectItem value="one-time">مرة واحدة</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.type ? (
                                            <p className="text-destructive text-sm">{errors.type}</p>
                                        ) : null}
                                    </div>
                                </FieldRow>

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Badge variant="secondary">متكرر = يتطلب تاريخ تجديد</Badge>
                                    <Badge variant="outline">مرة واحدة = بدون دورة تجديد</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="text-right">
                                <CardTitle>التكلفة ودورة الفوترة</CardTitle>
                                <CardDescription>المبلغ والعملة ومعدل التكرار.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-5">
                                <FieldRow>
                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="amount">المبلغ</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            aria-invalid={errors.amount !== undefined}
                                            className="min-h-11"
                                        />
                                        {errors.amount ? (
                                            <p className="text-destructive text-sm">{errors.amount}</p>
                                        ) : null}
                                    </div>
                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="currency">العملة</Label>
                                        <Select
                                            value={data.currency}
                                            onValueChange={(value) => setData('currency', value as 'EGP' | 'USD')}
                                        >
                                            <SelectTrigger id="currency" aria-invalid={errors.currency !== undefined}>
                                                <SelectValue placeholder="اختر العملة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="EGP">EGP</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.currency ? (
                                            <p className="text-destructive text-sm">{errors.currency}</p>
                                        ) : null}
                                    </div>
                                </FieldRow>

                                <div className="grid gap-2">
                                    <Label htmlFor="billing">دورة الفوترة</Label>
                                    <Select
                                        value={data.billing_cycle}
                                        onValueChange={(value) => setData('billing_cycle', value)}
                                        disabled={data.type === 'one-time'}
                                    >
                                        <SelectTrigger id="billing" aria-invalid={errors.billing_cycle !== undefined}>
                                            <SelectValue placeholder="اختر دورة الفوترة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="monthly">شهري</SelectItem>
                                                <SelectItem value="annual">سنوي</SelectItem>
                                                <SelectItem value="one-time">مرة واحدة</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.billing_cycle ? (
                                        <p className="text-destructive text-sm">{errors.billing_cycle}</p>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="text-right">
                                <CardTitle>التواريخ والتنبيه</CardTitle>
                                <CardDescription>
                                    إن وُجد تاريخ بداية وتجديد معاً، يجب ألا يكون التجديد قبل البداية.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-5">
                                <FieldRow>
                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="started_at_trigger">تاريخ البداية</Label>
                                        <Popover open={startedPopoverOpen} onOpenChange={setStartedPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="started_at_trigger"
                                                    type="button"
                                                    variant="outline"
                                                    className="min-h-11 w-full justify-between font-normal"
                                                    aria-invalid={errors.started_at !== undefined}
                                                >
                                                    <span>
                                                        {formatOptionalExpenseDateLabel(
                                                            data.started_at,
                                                            'اختر تاريخ البداية (اختياري)',
                                                        )}
                                                    </span>
                                                    <CalendarDaysIcon data-icon="inline-end" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={parseYmdToDate(data.started_at)}
                                                    onSelect={(date) => {
                                                        setData('started_at', date ? formatDateToYmd(date) : '');
                                                        setStartedPopoverOpen(false);
                                                    }}
                                                    captionLayout="dropdown"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {errors.started_at ? (
                                            <p className="text-destructive text-sm">{errors.started_at}</p>
                                        ) : null}
                                    </div>

                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="renewal_trigger">تاريخ التجديد القادم</Label>
                                        <Popover
                                            open={renewalPopoverOpen}
                                            onOpenChange={(open) => {
                                                if (data.type !== 'one-time') {
                                                    setRenewalPopoverOpen(open);
                                                }
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="renewal_trigger"
                                                    type="button"
                                                    variant="outline"
                                                    disabled={data.type === 'one-time'}
                                                    className="min-h-11 w-full justify-between font-normal"
                                                    aria-invalid={nextRenewalDisplayError !== undefined}
                                                >
                                                    <span>
                                                        {formatOptionalExpenseDateLabel(
                                                            data.next_renewal_date,
                                                            data.type === 'one-time'
                                                                ? 'لا ينطبق على مصروف لمرة واحدة'
                                                                : 'اختر تاريخ التجديد',
                                                        )}
                                                    </span>
                                                    <CalendarDaysIcon data-icon="inline-end" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={parseYmdToDate(data.next_renewal_date)}
                                                    onSelect={(date) => {
                                                        setData('next_renewal_date', date ? formatDateToYmd(date) : '');
                                                        setRenewalPopoverOpen(false);
                                                    }}
                                                    captionLayout="dropdown"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {nextRenewalDisplayError ? (
                                            <p className="text-destructive text-sm">{nextRenewalDisplayError}</p>
                                        ) : null}
                                    </div>

                                    <div className="grid min-w-0 flex-1 gap-2 md:min-w-[200px]">
                                        <Label htmlFor="alert_days_before">التنبيه قبل التجديد (بالأيام)</Label>
                                        <Input
                                            id="alert_days_before"
                                            type="number"
                                            min={0}
                                            value={data.alert_days_before}
                                            onChange={(e) => setData('alert_days_before', e.target.value)}
                                            disabled={data.type === 'one-time'}
                                            aria-invalid={errors.alert_days_before !== undefined}
                                            className="min-h-11"
                                        />
                                        {errors.alert_days_before ? (
                                            <p className="text-destructive text-sm">{errors.alert_days_before}</p>
                                        ) : null}
                                    </div>
                                </FieldRow>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <Collapsible open={optionalCollapsibleOpen} onOpenChange={setOptionalSectionOpen}>
                                <CardHeader className="pb-2 text-right">
                                    <CollapsibleTrigger
                                        type="button"
                                        className="flex w-full items-start justify-between gap-3 rounded-lg py-1 text-right outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <CardTitle className="text-base">روابط وملاحظات (اختياري)</CardTitle>
                                            <CardDescription className="text-pretty">
                                                رابط إلغاء الاشتراك أو أي تفاصيل إضافية — انقر للعرض أو الإخفاء.
                                            </CardDescription>
                                        </div>
                                        <ChevronDownIcon
                                            className="text-muted-foreground mt-0.5 size-5 shrink-0 transition-transform duration-200"
                                            aria-hidden
                                        />
                                    </CollapsibleTrigger>
                                </CardHeader>
                                <CollapsibleContent>
                                    <CardContent className="flex flex-col gap-5 pt-0">
                                        <div className="grid gap-2">
                                            <Label htmlFor="cancel_url">رابط الإلغاء</Label>
                                            <Input
                                                id="cancel_url"
                                                type="url"
                                                value={data.cancel_url}
                                                onChange={(e) => setData('cancel_url', e.target.value)}
                                                aria-invalid={errors.cancel_url !== undefined}
                                                className="min-h-11"
                                            />
                                            {errors.cancel_url ? (
                                                <p className="text-destructive text-sm">{errors.cancel_url}</p>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="notes">ملاحظات</Label>
                                            <Textarea
                                                id="notes"
                                                className="min-h-24"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                aria-invalid={errors.notes !== undefined}
                                            />
                                            {errors.notes ? (
                                                <p className="text-destructive text-sm">{errors.notes}</p>
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>{statusLabel}</Badge>
                            {expense.autoDetected ? (
                                <Badge variant="secondary">مكتشف تلقائيًا</Badge>
                            ) : null}
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <Button type="submit" disabled={processing || Boolean(dateOrderClientError)} size="lg">
                                <SaveIcon data-icon="inline-start" />
                                حفظ التعديلات
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href={index()}>إلغاء</Link>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

ExpensesEdit.layout = {
    breadcrumbs: [
        {
            title: 'المصروفات',
            href: index(),
        },
        {
            title: 'تعديل',
            href: index(),
        },
    ],
};
