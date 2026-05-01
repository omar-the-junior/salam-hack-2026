import { Head, router } from '@inertiajs/react';
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    ChevronDownIcon,
    ClockIcon,
    CopyIcon,
    CreditCardIcon,
    LockIcon,
    ShieldCheckIcon,
    XCircleIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

type PaymentLinkData = {
    amount: string;
    tax_rate: string;
    tax_amount: string;
    total_amount: string;
    currency: string;
    description: string;
    due_date: string | null;
    /** pending | paid | expired */
    state: string;
};

type PayShowProps = {
    paymentLink: PaymentLinkData;
    initiateUrl: string;
    /** UX-only hint from Paymob callback: success | pending | failed | '' */
    paymentState: string;
};

/** Paymob sandbox Mastercard — copy uses digits only (no spaces). */
const TEST_CARD_PAN_DIGITS = '5123456789012346';

function formatPanForDisplay(digits: string): string {
    const cleaned = digits.replace(/\D/g, '');

    return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

function formatMoney(value: string | number, currency: string): string {
    const n = typeof value === 'string' ? Number.parseFloat(value) : value;
    const safeCurrency = currency === 'USD' ? 'USD' : 'EGP';

    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: safeCurrency, minimumFractionDigits: 2 }).format(
        Number.isNaN(n) ? 0 : n,
    );
}

export default function PayShow({ paymentLink, initiateUrl, paymentState }: PayShowProps) {
    const [loading, setLoading] = useState(false);
    const [, copy] = useClipboard();
    const testCard = {
        expiry: '01/39',
        cvv: '123',
        name: 'Test Account',
    };

    const handlePayNow = () => {
        setLoading(true);
        router.post(initiateUrl, {}, { onError: () => setLoading(false) });
    };

    const copyField = async (value: string, fieldName: string) => {
        const copied = await copy(value);

        if (copied) {
            toast.success(`تم نسخ ${fieldName}`);

            return;
        }

        toast.error(`تعذر نسخ ${fieldName}`);
    };

    if (paymentLink.state === 'paid') {
        return (
            <>
                <Head title="تم الدفع" />
                <div className="mx-auto w-full max-w-md">
                    <Card className="overflow-hidden border-0 shadow-none sm:border sm:shadow-sm">
                        <div className="h-1 bg-emerald-500" />
                        <CardHeader className="items-center gap-3 pb-2 pt-8 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
                                <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <CardTitle className="text-xl">تم الدفع بنجاح</CardTitle>
                            <CardDescription className="text-base">تم تأكيد هذه الدفعة مسبقاً.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </>
        );
    }

    if (paymentLink.state === 'expired') {
        return (
            <>
                <Head title="رابط الدفع منتهي" />
                <div className="mx-auto w-full max-w-md">
                    <Card className="overflow-hidden border-0 shadow-none sm:border sm:shadow-sm">
                        <div className="h-1 bg-destructive" />
                        <CardHeader className="items-center gap-3 pb-2 pt-8 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
                                <XCircleIcon className="size-8 text-destructive" />
                            </div>
                            <CardTitle className="text-xl">رابط الدفع منتهي الصلاحية</CardTitle>
                            <CardDescription className="text-base">انتهت صلاحية هذا الرابط أو تم إلغاؤه.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </>
        );
    }

    const alerts = (
        <div className="flex flex-col gap-3">
            {paymentState === 'pending' ? (
                <Alert className="border-amber-500/30 bg-amber-500/5">
                    <ClockIcon />
                    <AlertTitle>جارٍ معالجة الدفع</AlertTitle>
                    <AlertDescription>
                        تمت إعادة توجيهك من بوابة الدفع. سيتم تحديث حالة الدفع قريباً.
                    </AlertDescription>
                </Alert>
            ) : null}
            {paymentState === 'failed' ? (
                <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>فشل الدفع</AlertTitle>
                    <AlertDescription>لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى.</AlertDescription>
                </Alert>
            ) : null}
            {paymentState === 'success' ? (
                <Alert className="border-primary/30 bg-primary/5">
                    <CheckCircle2Icon />
                    <AlertTitle>تمت عملية الدفع</AlertTitle>
                    <AlertDescription>شكراً لك! تمت معالجة دفعتك بنجاح.</AlertDescription>
                </Alert>
            ) : null}
        </div>
    );

    const summaryCard = (
        <Card className="gap-0 py-0 shadow-sm">
            <CardHeader className="gap-3 border-b bg-muted/20 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-1">
                        <CardTitle className="text-lg leading-snug">ملخص الطلب</CardTitle>
                        <CardDescription className="text-start text-sm leading-relaxed">
                            {paymentLink.description}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                        بانتظار الدفع
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 py-5">
                <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">المبلغ الأساسي</span>
                        <span className="tabular-nums font-medium">
                            {formatMoney(paymentLink.amount, paymentLink.currency)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">الضريبة ({paymentLink.tax_rate}%)</span>
                        <span className="tabular-nums font-medium">
                            {formatMoney(paymentLink.tax_amount, paymentLink.currency)}
                        </span>
                    </div>
                </div>
                <Separator />
                <div className="flex items-end justify-between gap-4 rounded-lg bg-primary/10 px-4 py-3 dark:bg-primary/15">
                    <span className="text-sm font-semibold">المبلغ المستحق</span>
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-primary">
                        {formatMoney(paymentLink.total_amount, paymentLink.currency)}
                    </span>
                </div>
                {paymentLink.due_date ? (
                    <p className="text-xs text-muted-foreground">
                        تاريخ الاستحقاق:{' '}
                        <span className="font-medium text-foreground">{paymentLink.due_date}</span>
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );

    const paymentColumn = (
        <div className="flex flex-col gap-4 lg:gap-5">
            <Card className="gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="border-b bg-muted/15 px-5 py-4">
                    <CardTitle className="text-lg">إتمام الدفع</CardTitle>
                    <CardDescription>سيتم تحويلك إلى بوابة Paymob لإدخال بيانات البطاقة بأمان.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-5 py-5">
                    <div>
                        <p className="mb-2 text-sm font-medium text-foreground">طريقة الدفع</p>
                        <div
                            className={cn(
                                'flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4',
                                'min-h-14',
                            )}
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                                <CreditCardIcon className="size-5 text-primary" />
                            </div>
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-sm font-semibold">بطاقة ائتمان أو خصم</span>
                                <span className="text-xs text-muted-foreground">Visa، Mastercard، وأشهر الشبكات</span>
                            </div>
                            <div className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary">
                                <CheckCircle2Icon className="size-3 text-primary-foreground" />
                            </div>
                        </div>
                    </div>

                    <Collapsible defaultOpen className="rounded-xl border bg-muted/25">
                        <CollapsibleTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className="group flex h-12 w-full items-center justify-between gap-2 rounded-none rounded-t-xl px-4 py-2 hover:bg-muted/50"
                            >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <ShieldCheckIcon className="size-4 text-muted-foreground" />
                                    بيانات بطاقة اختبار Paymob
                                </span>
                                <span className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-normal">
                                        Sandbox
                                    </Badge>
                                    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </span>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="border-t px-3 pb-4 pt-1 sm:px-4">
                                <div className="rounded-lg border bg-background p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Badge variant="secondary">Mastercard</Badge>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="min-h-9"
                                            onClick={() => copyField(TEST_CARD_PAN_DIGITS, 'رقم البطاقة')}
                                        >
                                            <CopyIcon data-icon="inline-start" />
                                            نسخ الرقم
                                        </Button>
                                    </div>
                                    <div dir="ltr" className="mt-3 min-w-0 overflow-x-auto rounded-md bg-muted/40 px-3 py-2.5">
                                        <p className="text-start font-mono text-lg tabular-nums tracking-wider text-foreground sm:text-xl">
                                            {formatPanForDisplay(TEST_CARD_PAN_DIGITS)}
                                        </p>
                                    </div>

                                    <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
                                        <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3">
                                            <Label className="text-xs font-normal text-muted-foreground">Expiry</Label>
                                            <div className="flex items-center justify-between gap-2">
                                                <p dir="ltr" className="font-mono text-sm tabular-nums">
                                                    {testCard.expiry}
                                                </p>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0"
                                                            aria-label="نسخ تاريخ الانتهاء"
                                                            onClick={() => copyField(testCard.expiry, 'تاريخ الانتهاء')}
                                                        >
                                                            <CopyIcon />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">نسخ تاريخ الانتهاء</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3">
                                            <Label className="text-xs font-normal text-muted-foreground">CVV</Label>
                                            <div className="flex items-center justify-between gap-2">
                                                <p dir="ltr" className="font-mono text-sm tabular-nums">
                                                    {testCard.cvv}
                                                </p>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0"
                                                            aria-label="نسخ رمز الأمان"
                                                            onClick={() => copyField(testCard.cvv, 'رمز الأمان')}
                                                        >
                                                            <CopyIcon />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">نسخ رمز الأمان</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3 sm:col-span-1">
                                            <Label className="text-xs font-normal text-muted-foreground">Name</Label>
                                            <div className="flex items-center justify-between gap-2">
                                                <p dir="ltr" className="truncate text-sm">
                                                    {testCard.name}
                                                </p>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0"
                                                            aria-label="نسخ اسم البطاقة"
                                                            onClick={() => copyField(testCard.name, 'اسم البطاقة')}
                                                        >
                                                            <CopyIcon />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">نسخ اسم البطاقة</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
                                    <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" />
                                    <p>
                                        بيانات وهمية للاختبار فقط — لتجربة التكامل دون بطاقة حقيقية.
                                    </p>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
                <Button className="min-h-12 w-full text-base shadow-sm" size="lg" onClick={handlePayNow} disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner data-icon="inline-start" />
                            جارٍ التحويل إلى بوابة الدفع...
                        </>
                    ) : (
                        <>
                            <CreditCardIcon data-icon="inline-start" />
                            ادفع الآن · {formatMoney(paymentLink.total_amount, paymentLink.currency)}
                        </>
                    )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <LockIcon className="size-3.5 shrink-0" />
                    <span>معالجة آمنة عبر Paymob</span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Head title="صفحة الدفع" />
            <div className="flex w-full flex-col gap-5 pb-6 sm:gap-6 lg:pb-8">
                {alerts}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-8">
                    <div className="order-2 flex flex-col lg:order-1 lg:col-span-7">{paymentColumn}</div>

                    <aside className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-6 lg:self-start">{summaryCard}</aside>
                </div>
            </div>
        </>
    );
}

PayShow.layout = {
    title: 'مراجعة رابط الدفع',
    description: 'عرض تفاصيل طلب الدفع وإتمام العملية',
    variant: 'wide' as const,
};
