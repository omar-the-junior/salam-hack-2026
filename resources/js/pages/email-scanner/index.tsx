import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2Icon, LinkIcon, LoaderCircleIcon, MailIcon, RefreshCwIcon, ScanSearchIcon, SparklesIcon, UnlinkIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { index } from '@/routes/email-scanner';
import { review } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';

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

    const [isScanning, setIsScanning] = useState(false);

    const isConnected = !!connected_account;

    const triggerScan = () => {
        setIsScanning(true);
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
                                    <Button onClick={triggerScan} disabled={isScanning}>
                                        {isScanning ? (
                                            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                                        ) : (
                                            <ScanSearchIcon data-icon="inline-start" />
                                        )}
                                        {isScanning ? 'جاري الفحص...' : 'فحص آخر شهرين'}
                                    </Button>
                                    <Button variant="outline" onClick={disconnectGmail} disabled={isScanning}>
                                        <UnlinkIcon data-icon="inline-start" />
                                        فصل Gmail
                                    </Button>
                                </>
                            )}
                        </div>

                        {!isConnected && !isScanning && !latest_scan ? (
                            <Alert>
                                <SparklesIcon />
                                <AlertTitle>اربط Gmail أولًا</AlertTitle>
                                <AlertDescription>
                                    بعد الربط ستظهر حالة الفحص والنتائج هنا تلقائيًا.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {isScanning ? (
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <LoaderCircleIcon className="size-5 animate-spin" />
                                        جاري فحص البريد الإلكتروني
                                    </CardTitle>
                                    <CardDescription>يرجى الانتظار — يتم الآن تحليل رسائل الفواتير والاشتراكات.</CardDescription>
                                </CardHeader>
                            </Card>
                        ) : null}

                        {latest_scan?.status === 'completed' ? (
                            <Alert>
                                <CheckCircle2Icon />
                                <AlertTitle>اكتمل الفحص</AlertTitle>
                                <AlertDescription className="flex flex-wrap items-center gap-3">
                                    <span>تم العثور على {latest_scan?.found_count ?? 0} اشتراكات جديدة. يمكنك مراجعتها الآن.</span>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={review()}>عرض المراجعة</Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {latest_scan?.status === 'failed' ? (
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
