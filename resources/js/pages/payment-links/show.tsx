import { Head, Link } from '@inertiajs/react';
import { CopyIcon, FolderKanbanIcon, LinkIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useClipboard } from '@/hooks/use-clipboard';
import { show as contractShow } from '@/routes/contracts';
import { show as milestoneShow } from '@/routes/milestones';
import { index } from '@/routes/payment-links';

type PaymentLinkDetails = {
    id: string;
    amount: string;
    tax_rate: string;
    tax_amount: string;
    total_amount: string;
    currency: string;
    description: string;
    client_name: string;
    client_email: string;
    due_date: string | null;
    status: string;
    public_token: string;
    mock_gateway_reference: string;
    milestone?: {
        id: string;
        title: string;
        contract?: {
            id: string;
            project_name: string;
        } | null;
    } | null;
};

type PaymentLinksShowProps = {
    paymentLink: PaymentLinkDetails;
    shareableUrl: string;
};

function formatMoney(value: string | number, currency: string): string {
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
    const safeCurrency = currency === 'USD' ? 'USD' : 'EGP';

    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 2,
    }).format(Number.isNaN(parsed) ? 0 : parsed);
}

export default function PaymentLinksShow({ paymentLink, shareableUrl }: PaymentLinksShowProps) {
    const [, copy] = useClipboard();
    const statusLabel =
        paymentLink.status === 'paid'
            ? 'مدفوعة'
            : paymentLink.status === 'overdue'
              ? 'متأخرة'
              : 'بانتظار الدفع';

    const copyLink = async () => {
        const copied = await copy(shareableUrl);

        if (copied) {
            toast.success('تم نسخ رابط الدفع');

            return;
        }

        toast.error('تعذر نسخ الرابط، انسخه يدوياً');
    };

    return (
        <>
            <Head title="رابط الدفع" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1">
                            <CardTitle>تفاصيل رابط الدفع</CardTitle>
                            <CardDescription>مرجع الرابط: {paymentLink.public_token}</CardDescription>
                        </div>
                        <Badge
                            variant={
                                paymentLink.status === 'paid'
                                    ? 'default'
                                    : paymentLink.status === 'overdue'
                                      ? 'destructive'
                                      : 'secondary'
                            }
                        >
                            {statusLabel}
                        </Badge>
                    </CardHeader>
                </Card>

                <div className="grid gap-4 lg:grid-cols-12">
                    <Card className="lg:col-span-7">
                        <CardHeader>
                            <CardTitle>بيانات الرابط</CardTitle>
                            <CardDescription>تفاصيل الدفع والمشاركة</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">المبلغ الإجمالي المستحق</p>
                                <p className="text-2xl font-semibold">
                                    {formatMoney(paymentLink.total_amount, paymentLink.currency)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    المبلغ {formatMoney(paymentLink.amount, paymentLink.currency)} + الضريبة (
                                    {paymentLink.tax_rate}%)
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium">الرابط القابل للمشاركة</p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input readOnly value={shareableUrl} className="font-mono" />
                                    <Button type="button" onClick={copyLink}>
                                        <CopyIcon data-icon="inline-start" />
                                        نسخ الرابط
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-3 sm:grid-cols-2">
                                <p className="text-sm">
                                    <span className="font-medium">الوصف:</span> {paymentLink.description}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">الاستحقاق:</span> {paymentLink.due_date ?? 'غير محدد'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">مرجع البوابة:</span>{' '}
                                    {paymentLink.mock_gateway_reference}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">الحالة:</span> {statusLabel}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4 lg:col-span-5">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserIcon />
                                    بيانات العميل
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-sm">
                                    <span className="font-medium">الاسم:</span> {paymentLink.client_name}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">البريد:</span> {paymentLink.client_email}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderKanbanIcon />
                                    العقد والمرحلة
                                </CardTitle>
                                <CardDescription>رابط الدفع مرتبط بهذه المرحلة ضمن المشروع.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {paymentLink.milestone ? (
                                    <>
                                        <p className="text-sm">
                                            <span className="font-medium">المشروع:</span>{' '}
                                            {paymentLink.milestone.contract?.project_name ?? '—'}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">المرحلة:</span> {paymentLink.milestone.title}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {paymentLink.milestone.contract ? (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={contractShow({ contract: paymentLink.milestone.contract })}
                                                        prefetch
                                                    >
                                                        صفحة العقد
                                                    </Link>
                                                </Button>
                                            ) : null}
                                            <Button variant="outline" size="sm" asChild>
                                                <Link
                                                    href={milestoneShow({ milestone: paymentLink.milestone })}
                                                    prefetch
                                                >
                                                    صفحة المرحلة
                                                </Link>
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm">لا توجد بيانات مرحلة.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LinkIcon />
                                    معلومات تقنية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-sm">
                                    <span className="font-medium">Token:</span> {paymentLink.public_token}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Gateway Ref:</span>{' '}
                                    {paymentLink.mock_gateway_reference}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

PaymentLinksShow.layout = {
    breadcrumbs: [
        {
            title: 'روابط الدفع',
            href: index(),
        },
        {
            title: 'التفاصيل',
            href: index(),
        },
    ],
};
