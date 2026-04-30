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
            <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-4 p-4">
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

                <Card className="overflow-hidden">
                    <CardHeader className="items-center gap-3 text-center">
                        <StatusIcon className="size-12" />
                        <Badge variant={isSuccess ? 'default' : isFailed ? 'destructive' : 'secondary'}>{statusConfig.badge}</Badge>
                        <CardTitle>{statusConfig.title}</CardTitle>
                        <CardDescription>{statusConfig.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">المبلغ</span>
                                <span>{formatMoney(transaction.amount_cents, transaction.currency)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">رقم العملية</span>
                                <span dir="ltr">{transaction.id || '-'}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">رقم الطلب</span>
                                <span dir="ltr">{transaction.order_id || '-'}</span>
                            </div>
                        </div>

                        {(transaction.card_brand || transaction.card_last_four) && (
                            <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                                <CreditCardIcon className="size-4 text-muted-foreground" />
                                <span>
                                    {transaction.card_brand || 'Card'} {transaction.card_last_four ? `•••• ${transaction.card_last_four}` : ''}
                                </span>
                            </div>
                        )}

                        {transaction.message && (
                            <Alert>
                                <ShieldCheckIcon />
                                <AlertTitle>رسالة بوابة الدفع</AlertTitle>
                                <AlertDescription>{transaction.message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>

                    <Separator />

                    <CardFooter className="pt-4">
                        {retryUrl ? (
                            <Button asChild className="w-full">
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
        </>
    );
}

PayReceipt.layout = {
    title: 'حالة الدفع',
    description: 'عرض نتيجة معاملة الدفع',
};
