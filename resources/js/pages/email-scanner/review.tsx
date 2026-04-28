import { Head, Link } from '@inertiajs/react';
import { CheckIcon, CircleAlertIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { index, review } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';

type Confidence = 'high' | 'medium' | 'low';
type BillingCycle = 'monthly' | 'annual' | 'one-time' | 'unknown';
type QueueStatus = 'pending' | 'approved' | 'rejected';

type ReviewItem = {
    id: string;
    serviceName: string;
    amount: number;
    currency: 'EGP' | 'USD';
    billingCycle: BillingCycle;
    billingDate: string;
    confidence: Confidence;
    snippet: string;
    status: QueueStatus;
};

const INITIAL_ITEMS: ReviewItem[] = [
    {
        id: 'r_001',
        serviceName: 'Figma',
        amount: 15,
        currency: 'USD',
        billingCycle: 'monthly',
        billingDate: '2026-04-12',
        confidence: 'high',
        snippet: 'Your Figma subscription has been renewed.',
        status: 'pending',
    },
    {
        id: 'r_002',
        serviceName: 'Notion',
        amount: 96,
        currency: 'USD',
        billingCycle: 'annual',
        billingDate: '2026-03-29',
        confidence: 'medium',
        snippet: 'Invoice for Notion Plus annual plan.',
        status: 'pending',
    },
    {
        id: 'r_003',
        serviceName: 'Canva',
        amount: 420,
        currency: 'EGP',
        billingCycle: 'unknown',
        billingDate: '2026-04-10',
        confidence: 'low',
        snippet: 'Your payment has been confirmed.',
        status: 'pending',
    },
];

function formatMoney(value: number, currency: 'EGP' | 'USD'): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(value);
}

export default function EmailScannerReview() {
    const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);

    const pendingItems = useMemo(() => items.filter((item) => item.status === 'pending'), [items]);

    const updateItemStatus = (id: string, status: QueueStatus) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    };

    const approveAll = () => {
        setItems((prev) => prev.map((item) => (item.status === 'pending' ? { ...item, status: 'approved' } : item)));
    };

    const confidenceBadge = (confidence: Confidence) => {
        if (confidence === 'high') {
            return <Badge>ثقة عالية</Badge>;
        }
        if (confidence === 'medium') {
            return <Badge variant="secondary">ثقة متوسطة</Badge>;
        }
        return <Badge variant="destructive">ثقة منخفضة</Badge>;
    };

    return (
        <>
            <Head title="مراجعة الاشتراكات" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>مراجعة الاشتراكات المكتشفة</CardTitle>
                            <CardDescription>
                                راجع العناصر المكتشفة من البريد وأضف الصحيح منها إلى المصروفات.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={index()}>العودة للفحص</Link>
                            </Button>
                            <Button onClick={approveAll} disabled={pendingItems.length === 0}>
                                <CheckIcon data-icon="inline-start" />
                                اعتماد الكل
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {pendingItems.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                            <SparklesIcon className="text-muted-foreground" />
                            <p className="text-muted-foreground">تمت مراجعة جميع النتائج.</p>
                            <Button asChild>
                                <Link href={expensesIndex()}>الانتقال إلى المصروفات</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingItems.map((item) => (
                            <Card key={item.id} className={item.confidence === 'low' ? 'border-amber-400/80' : undefined}>
                                <CardHeader className="gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-lg">{item.serviceName}</CardTitle>
                                            <CardDescription>{item.snippet}</CardDescription>
                                        </div>
                                        {confidenceBadge(item.confidence)}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-muted rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs">المبلغ</p>
                                            <p className="font-medium">{formatMoney(item.amount, item.currency)}</p>
                                        </div>
                                        <div className="bg-muted rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs">الدورة</p>
                                            <p className="font-medium">
                                                {item.billingCycle === 'monthly'
                                                    ? 'شهري'
                                                    : item.billingCycle === 'annual'
                                                        ? 'سنوي'
                                                        : item.billingCycle === 'one-time'
                                                            ? 'مرة واحدة'
                                                            : 'غير معروف'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                        <CircleAlertIcon className="size-4" />
                                        تاريخ الكشف: {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(item.billingDate))}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={() => updateItemStatus(item.id, 'approved')}>
                                            <CheckIcon data-icon="inline-start" />
                                            إضافة إلى المصروفات
                                        </Button>
                                        <Button variant="outline" onClick={() => updateItemStatus(item.id, 'rejected')}>
                                            <XIcon data-icon="inline-start" />
                                            رفض
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

EmailScannerReview.layout = {
    breadcrumbs: [
        {
            title: 'فحص الاشتراكات',
            href: index(),
        },
        {
            title: 'مراجعة الاشتراكات',
            href: review(),
        },
    ],
};
