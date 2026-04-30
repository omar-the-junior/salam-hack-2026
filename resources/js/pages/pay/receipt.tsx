import { Head } from '@inertiajs/react';
import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, CreditCardIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type PaymentStatusProps = {
    status: 'success' | 'failed' | 'pending';
    isVerifiedCallback: boolean;
    transaction: {
        id: string;
        order_id: string;
        amount_cents: number;
        currency: string;
        card_last_four: string;
        card_brand: string;
        message: string;
        paid_at: string | null;
    };
    retry_url: string | null;
};

function formatMoney(amountCents: number, currency: string): string {
    const amount = Number.isFinite(amountCents) ? amountCents / 100 : 0;
    const safeCurrency = currency === 'USD' ? 'USD' : 'EGP';

    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function PayReceipt({ status, isVerifiedCallback, transaction, retry_url: retryUrl }: PaymentStatusProps) {
    const statusConfig = {
        success: {
            title: 'تم الدفع بنجاح',
            description: 'تم تأكيد المعاملة ويمكنك إغلاق هذه الصفحة بأمان.',
            icon: CheckCircle2Icon,
            badge: 'ناجحة',
        },
        failed: {
            title: 'تعذر إتمام الدفع',
            description: 'لم تكتمل المعاملة. يمكنك إعادة المحاولة من رابط الدفع.',
            icon: AlertCircleIcon,
            badge: 'فاشلة',
        },
        pending: {
            title: 'المعاملة قيد المراجعة',
            description: 'ما زلنا ننتظر التأكيد النهائي من بوابة الدفع.',
            icon: Clock3Icon,
            badge: 'قيد المعالجة',
        },
    }[status];

    const StatusIcon = statusConfig.icon;
    const isSuccess = status === 'success';
    const isFailed = status === 'failed';

    return (
        <>
            <Head title="حالة الدفع" />
            <div className="flex min-h-svh w-full items-center justify-center bg-muted/20 p-3 sm:p-4">
                <div className="flex w-full max-w-xl flex-col gap-3 sm:gap-4">
                    <div className="flex justify-center">
                        <AppLogo className="h-8" />
                    </div>

                    {!isVerifiedCallback && (
                        <Alert variant="destructive">
                            <AlertCircleIcon />
                            <AlertTitle>تعذر التحقق من التوقيع</AlertTitle>
                            <AlertDescription>
                                تم عرض الحالة اعتماداً على سجلات النظام فقط، وتجاهلنا بيانات الرجوع غير الموقعة.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card className="flex max-h-[calc(100svh-6.5rem)] flex-col overflow-hidden">
                        <CardHeader className="items-center gap-2.5 border-b bg-background/80 py-4 text-center sm:gap-3 sm:py-5">
                            <StatusIcon className="size-10 sm:size-12" />
                            <Badge variant={isSuccess ? 'default' : isFailed ? 'destructive' : 'secondary'}>{statusConfig.badge}</Badge>
                            <CardTitle className="text-lg sm:text-xl">{statusConfig.title}</CardTitle>
                            <CardDescription className="max-w-md">{statusConfig.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5">
                            <div className="flex flex-col gap-3">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">المبلغ</span>
                                        <span className="text-base font-semibold">{formatMoney(transaction.amount_cents, transaction.currency)}</span>
                                    </div>

                                    <Separator className="my-3" />

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">رقم العملية</span>
                                            <span className="truncate text-left font-medium" dir="ltr">
                                                {transaction.id || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">رقم الطلب</span>
                                            <span className="truncate text-left font-medium" dir="ltr">
                                                {transaction.order_id || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {(transaction.card_brand || transaction.card_last_four) && (
                                    <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                                        <CreditCardIcon className="size-4 text-muted-foreground" />
                                        <span className="truncate">
                                            {transaction.card_brand || 'Card'}{' '}
                                            {transaction.card_last_four ? `•••• ${transaction.card_last_four}` : ''}
                                        </span>
                                    </div>
                                )}

                                {transaction.message && (
                                    <Alert>
                                        <ShieldCheckIcon />
                                        <AlertTitle>رسالة بوابة الدفع</AlertTitle>
                                        <AlertDescription className="wrap-break-word">{transaction.message}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:p-5">
                            {retryUrl ? (
                                <Button asChild className="w-full" size="lg">
                                    <a href={retryUrl}>
                                        <RefreshCwIcon data-icon="inline-start" />
                                        العودة إلى رابط الدفع
                                    </a>
                                </Button>
                            ) : (
                                <p className="w-full text-center text-sm text-muted-foreground">يمكنك إغلاق الصفحة الآن.</p>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}

PayReceipt.layout = {
    title: 'حالة الدفع',
    description: 'عرض نتيجة معاملة الدفع',
};
