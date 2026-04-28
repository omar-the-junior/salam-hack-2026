import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PublicPaymentLink = {
    amount: string;
    tax_amount: string;
    tax_rate: string;
    total_amount: string;
    currency: string;
    description: string;
    client_name: string;
    due_date: string | null;
    status: string;
};

function formatMoney(value: string | number, currency: string): string {
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(Number.isNaN(parsed) ? 0 : parsed);
}

export default function PayShow({ paymentLink }: { paymentLink: PublicPaymentLink }) {
    return (
        <>
            <Head title="صفحة الدفع" />
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="mb-2 flex items-center justify-between">
                            <CardTitle>طلب دفع</CardTitle>
                            <Badge variant={paymentLink.status === 'pending' ? 'secondary' : 'default'}>
                                {paymentLink.status === 'pending' ? 'Pending' : paymentLink.status}
                            </Badge>
                        </div>
                        <CardDescription>
                            هذه معاينة للطلب. إتمام الدفع الفعلي سيتم في المرحلة التالية من التنفيذ.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p><span className="font-medium">العميل:</span> {paymentLink.client_name}</p>
                        <p><span className="font-medium">الوصف:</span> {paymentLink.description}</p>
                        <p><span className="font-medium">تاريخ الاستحقاق:</span> {paymentLink.due_date ?? 'غير محدد'}</p>
                        <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                            <p>المبلغ: {formatMoney(paymentLink.amount, paymentLink.currency)}</p>
                            <p>الضريبة ({paymentLink.tax_rate}%): {formatMoney(paymentLink.tax_amount, paymentLink.currency)}</p>
                            <p className="font-medium">الإجمالي: {formatMoney(paymentLink.total_amount, paymentLink.currency)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PayShow.layout = {
    title: 'مراجعة رابط الدفع',
    description: 'عرض تفاصيل طلب الدفع بشكل للقراءة فقط',
};
