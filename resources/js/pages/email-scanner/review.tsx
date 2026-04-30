import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckIcon, CircleAlertIcon, InboxIcon, SparklesIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { index, review } from '@/routes/email-scanner';
import { approve as approveResult, reject as rejectResult, approveAll as approveAllResults } from '@/routes/email-scanner/result';

type Confidence = 'high' | 'medium' | 'low';
type BillingCycle = 'monthly' | 'annual' | 'one-time' | 'unknown';

type ReviewItem = {
    id: string;
    serviceName: string;
    amount: number | null;
    currency: string;
    billingCycle: BillingCycle;
    billingDate: string | null;
    confidence: Confidence;
    snippet: string | null;
    subject: string | null;
    status: string;
};

type Props = {
    results: ReviewItem[];
};

function formatMoney(value: number | null, currency: string): string {
    if (value === null) return '—';
    try {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${value} ${currency}`;
    }
}

function cycleLabel(cycle: BillingCycle): string {
    if (cycle === 'monthly') return 'شهري';
    if (cycle === 'annual') return 'سنوي';
    if (cycle === 'one-time') return 'مرة واحدة';
    return 'غير معروف';
}

function confidenceBadge(confidence: Confidence) {
    if (confidence === 'high') return <Badge>ثقة عالية</Badge>;
    if (confidence === 'medium') return <Badge variant="secondary">ثقة متوسطة</Badge>;
    return <Badge variant="destructive">ثقة منخفضة</Badge>;
}

export default function EmailScannerReview() {
    const { results } = usePage<Props>().props;

    const handleApprove = (id: string) => {
        router.patch(approveResult.url({ result: id }), {}, { preserveScroll: true });
    };

    const handleReject = (id: string) => {
        router.patch(rejectResult.url({ result: id }), {}, { preserveScroll: true });
    };

    const handleApproveAll = () => {
        router.post(approveAllResults.url(), {}, { preserveScroll: true });
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
                                {results.length > 0 && (
                                    <span className="mr-2 font-medium">({results.length} نتيجة معلقة)</span>
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={index()}>العودة للفحص</Link>
                            </Button>
                            <Button onClick={handleApproveAll} disabled={results.length === 0}>
                                <CheckIcon data-icon="inline-start" />
                                اعتماد الكل
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {results.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                            <InboxIcon className="text-muted-foreground size-10" />
                            <p className="text-muted-foreground">لا توجد نتائج معلقة للمراجعة.</p>
                            <p className="text-muted-foreground text-sm">
                                قم بتشغيل فحص البريد الإلكتروني لاكتشاف الاشتراكات.
                            </p>
                            <Button asChild variant="outline">
                                <Link href={index()}>الذهاب إلى الفحص</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {results.map((item) => (
                            <Card
                                key={item.id}
                                className={item.confidence === 'low' ? 'border-amber-400/80' : undefined}
                            >
                                <CardHeader className="gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-lg">{item.serviceName}</CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {item.subject ?? item.snippet ?? '—'}
                                            </CardDescription>
                                        </div>
                                        {confidenceBadge(item.confidence)}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-muted rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs">المبلغ</p>
                                            <p className="font-medium">
                                                {formatMoney(item.amount, item.currency)}
                                            </p>
                                        </div>
                                        <div className="bg-muted rounded-lg p-3">
                                            <p className="text-muted-foreground mb-1 text-xs">الدورة</p>
                                            <p className="font-medium">{cycleLabel(item.billingCycle)}</p>
                                        </div>
                                    </div>

                                    {item.billingDate && (
                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                            <CircleAlertIcon className="size-4 shrink-0" />
                                            تاريخ الكشف:{' '}
                                            {new Intl.DateTimeFormat('ar-EG', {
                                                dateStyle: 'medium',
                                            }).format(new Date(item.billingDate))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={() => handleApprove(item.id)}>
                                            <CheckIcon data-icon="inline-start" />
                                            إضافة إلى المصروفات
                                        </Button>
                                        <Button variant="outline" onClick={() => handleReject(item.id)}>
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
