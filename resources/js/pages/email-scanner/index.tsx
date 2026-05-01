import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2Icon, LinkIcon, LoaderCircleIcon, MailIcon, RefreshCwIcon, ScanSearchIcon, SparklesIcon, UnlinkIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEmailScanStatus } from '@/hooks/use-email-scan-status';
import { index } from '@/routes/email-scanner';
import { review } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';
import { toast } from 'sonner';

type ConnectedAccount = {
    email: string;
} | null;

type LatestScan = {
    id: string;
    status: 'queued' | 'in_progress' | 'completed' | 'failed';
    found_count: number | null;
    error_message: string | null;
    created_at: string | null;
} | null;

type PageProps = {
    connected_account: ConnectedAccount;
    latest_scan: LatestScan;
};

export default function EmailScannerIndex() {
    const { connected_account, latest_scan } = usePage<{ props: PageProps }>().props as unknown as PageProps;

    const { scan, isRunning } = useEmailScanStatus(
        latest_scan ? { status: latest_scan.status, found_count: latest_scan.found_count, error: latest_scan.error_message } : null,
        (data) => {
            toast.success(`اكتمل الفحص — تم العثور على ${data.found_count ?? 0} اشتراكات.`, {
                duration: 8000,
                action: {
                    label: 'مراجعة النتائج',
                    onClick: () => router.visit(review()),
                },
            });
            router.reload();
        },
        (data) => {
            toast.error(data.error ?? 'فشل الفحص. أعد المحاولة.', { duration: 6000 });
            router.reload();
        },
    );

    const currentStatus = scan?.status ?? 'none';
    const isConnected = !!connected_account;

    const triggerScan = () => {
        router.post('/email-scanner/scan');
    };

    const disconnectGmail = () => {
        router.delete('/email-scanner/disconnect');
    };

    const lastScanDate = latest_scan?.created_at
        ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(latest_scan.created_at))
        : null;

    return (
        <>
            <Head title="فحص الاشتراكات" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>فحص الاشتراكات</CardTitle>
                            <CardDescription>
                                اربط Gmail لاكتشاف الاشتراكات تلقائيًا من آخر شهرين.
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href={expensesIndex()}>العودة إلى المصروفات</Link>
                        </Button>
                    </CardHeader>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>الحساب المرتبط</CardDescription>
                            <CardTitle className="text-base">
                                {isConnected ? connected_account.email : 'غير مرتبط'}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>آخر فحص</CardDescription>
                            <CardTitle className="text-base">
                                {lastScanDate ?? 'لا يوجد فحص سابق'}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>نتائج آخر فحص</CardDescription>
                            <CardTitle className="text-base">
                                {latest_scan?.status === 'completed'
                                    ? `${latest_scan.found_count ?? 0} اشتراكات مكتشفة`
                                    : 'لا توجد نتائج'}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardContent className="flex flex-col gap-4 pt-6">
                        <Alert>
                            <MailIcon />
                            <AlertTitle>صلاحية القراءة فقط</AlertTitle>
                            <AlertDescription>
                                يتم استخدام `gmail.readonly` فقط لتحليل رسائل الفواتير والاشتراكات.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-wrap gap-2">
                            {!isConnected ? (
                                <Button asChild>
                                    <a href="/email-scanner/connect">
                                        <LinkIcon data-icon="inline-start" />
                                        ربط حساب Gmail
                                    </a>
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={triggerScan} disabled={isRunning}>
                                        {isRunning ? (
                                            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                                        ) : (
                                            <ScanSearchIcon data-icon="inline-start" />
                                        )}
                                        {isRunning ? 'جاري الفحص...' : 'فحص آخر شهرين'}
                                    </Button>
                                    <Button variant="outline" onClick={disconnectGmail}>
                                        <UnlinkIcon data-icon="inline-start" />
                                        فصل Gmail
                                    </Button>
                                </>
                            )}
                        </div>

                        {!isConnected && currentStatus === 'none' ? (
                            <Alert>
                                <SparklesIcon />
                                <AlertTitle>اربط Gmail أولًا</AlertTitle>
                                <AlertDescription>
                                    بعد الربط ستظهر حالة الفحص والنتائج هنا تلقائيًا.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {currentStatus === 'queued' ? (
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-base">جاري الفحص</CardTitle>
                                    <CardDescription>يرجى الانتظار — قد يستغرق الفحص عدة دقائق.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={20} />
                                    <div className="mt-4">
                                        <Badge variant="secondary">
                                            <LoaderCircleIcon className="mr-1 size-3 animate-spin" />
                                            جاري المعالجة
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {currentStatus === 'in_progress' ? (
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-base">الفحص قيد التنفيذ</CardTitle>
                                    <CardDescription>جاري تحليل رسائل البريد الإلكتروني...</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <Progress value={60} />
                                    <div className="flex flex-wrap gap-2">
                                        <Badge>in_progress</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {currentStatus === 'completed' ? (
                            <Alert>
                                <CheckCircle2Icon />
                                <AlertTitle>اكتمل الفحص</AlertTitle>
                                <AlertDescription className="flex flex-wrap items-center gap-3">
                                    <span>تم العثور على {scan?.found_count ?? latest_scan?.found_count ?? 0} اشتراكات جديدة. يمكنك مراجعتها الآن.</span>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={review()}>عرض المراجعة</Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {currentStatus === 'failed' ? (
                            <Alert variant="destructive">
                                <AlertTitle>فشل الفحص</AlertTitle>
                                <AlertDescription className="flex flex-col gap-2">
                                    <span>حدث خطأ أثناء الوصول إلى Gmail. أعد المحاولة بعد قليل.</span>
                                    {isConnected ? (
                                        <Button size="sm" variant="outline" onClick={triggerScan}>
                                            <RefreshCwIcon data-icon="inline-start" />
                                            إعادة المحاولة
                                        </Button>
                                    ) : null}
                                </AlertDescription>
                            </Alert>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EmailScannerIndex.layout = {
    breadcrumbs: [
        {
            title: 'فحص الاشتراكات',
            href: index(),
        },
    ],
};
