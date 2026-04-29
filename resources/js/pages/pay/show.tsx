import { Head, router } from '@inertiajs/react';
import { AlertCircleIcon, CheckCircle2Icon, ClockIcon, CreditCardIcon, LockIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

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

function formatMoney(value: string | number, currency: string): string {
    const n = typeof value === 'string' ? Number.parseFloat(value) : value;

    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency, minimumFractionDigits: 2 }).format(
        Number.isNaN(n) ? 0 : n,
    );
}

export default function PayShow({ paymentLink, initiateUrl, paymentState }: PayShowProps) {
    const [loading, setLoading] = useState(false);

    const handlePayNow = () => {
        setLoading(true);
        router.post(initiateUrl, {}, { onError: () => setLoading(false) });
    };

    if (paymentLink.state === 'paid') {
        return (
            <>
                <Head title="تم الدفع" />
                <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
                    <Card className="overflow-hidden">
                        <div className="h-1.5 bg-emerald-500" />
                        <CardHeader className="items-center text-center">
                            <CheckCircle2Icon className="size-12 text-emerald-500" />
                            <CardTitle>تم الدفع بنجاح</CardTitle>
                            <CardDescription>تم تأكيد هذه الدفعة مسبقاً.</CardDescription>
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
                <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
                    <Card className="overflow-hidden">
                        <div className="h-1.5 bg-destructive" />
                        <CardHeader className="items-center text-center">
                            <XCircleIcon className="size-12 text-destructive" />
                            <CardTitle>رابط الدفع منتهي الصلاحية</CardTitle>
                            <CardDescription>انتهت صلاحية هذا الرابط أو تم إلغاؤه.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="صفحة الدفع" />
            <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
                {paymentState === 'pending' && (
                    <Alert>
                        <ClockIcon />
                        <AlertTitle>جارٍ معالجة الدفع</AlertTitle>
                        <AlertDescription>
                            تمت إعادة توجيهك من بوابة الدفع. سيتم تحديث حالة الدفع قريباً.
                        </AlertDescription>
                    </Alert>
                )}

                {paymentState === 'failed' && (
                    <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>فشل الدفع</AlertTitle>
                        <AlertDescription>لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى.</AlertDescription>
                    </Alert>
                )}

                {paymentState === 'success' && (
                    <Alert>
                        <CheckCircle2Icon />
                        <AlertTitle>تمت عملية الدفع</AlertTitle>
                        <AlertDescription>شكراً لك! تمت معالجة دفعتك بنجاح.</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>طلب دفع</CardTitle>
                            <Badge variant="secondary">بانتظار الدفع</Badge>
                        </div>
                        <CardDescription>{paymentLink.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4">
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">المبلغ الأساسي</span>
                                <span>{formatMoney(paymentLink.amount, paymentLink.currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">الضريبة ({paymentLink.tax_rate}%)</span>
                                <span>{formatMoney(paymentLink.tax_amount, paymentLink.currency)}</span>
                            </div>
                            <Separator className="my-2 border-dashed" />
                            <div className="flex justify-between font-semibold">
                                <span>الإجمالي</span>
                                <span className="text-lg">{formatMoney(paymentLink.total_amount, paymentLink.currency)}</span>
                            </div>
                        </div>

                        {paymentLink.due_date && (
                            <p className="text-sm text-muted-foreground">
                                تاريخ الاستحقاق: {paymentLink.due_date}
                            </p>
                        )}

                        <Separator />

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">طريقة الدفع</p>
                            <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-3">
                                <CreditCardIcon className="size-5 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">بطاقة الائتمان / الخصم</span>
                                    <span className="text-xs text-muted-foreground">Visa، Mastercard، وأكثر</span>
                                </div>
                                <div className="mr-auto flex size-4 items-center justify-center rounded-full border-2 border-primary">
                                    <div className="size-2 rounded-full bg-primary" />
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                        <Button className="w-full" size="lg" onClick={handlePayNow} disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner data-icon="inline-start" />
                                    جارٍ التحويل إلى بوابة الدفع...
                                </>
                            ) : (
                                <>
                                    <CreditCardIcon data-icon="inline-start" />
                                    ادفع الآن {formatMoney(paymentLink.total_amount, paymentLink.currency)}
                                </>
                            )}
                        </Button>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <LockIcon className="size-3" />
                            <span>تتم معالجة الدفع بشكل آمن عبر Paymob</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}

PayShow.layout = {
    title: 'مراجعة رابط الدفع',
    description: 'عرض تفاصيل طلب الدفع وإتمام العملية',
};
