import { Head, Link } from '@inertiajs/react';
import { CheckCircle2Icon, LoaderCircleIcon, MailIcon, RefreshCwIcon, ScanSearchIcon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { index } from '@/routes/email-scanner';
import { review } from '@/routes/email-scanner';
import { index as expensesIndex } from '@/routes/expenses';

export default function EmailScannerIndex() {
    const [status, setStatus] = useState<'not-connected' | 'queued' | 'in-progress' | 'completed' | 'failed'>(
        'not-connected',
    );

    return (
        <>
            <Head title="فحص الاشتراكات" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>فحص الاشتراكات</CardTitle>
                            <CardDescription>
                                اربط Gmail لاكتشاف الاشتراكات تلقائيًا من آخر 6 أشهر.
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
                            <CardTitle className="text-base">mustahaq.demo@gmail.com</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>آخر فحص</CardDescription>
                            <CardTitle className="text-base">قبل 3 أيام</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1">
                            <CardDescription>نتائج آخر فحص</CardDescription>
                            <CardTitle className="text-base">8 اشتراكات مكتشفة</CardTitle>
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
                            <Button onClick={() => setStatus('queued')}>
                                <ScanSearchIcon data-icon="inline-start" />
                                فحص آخر 6 أشهر
                            </Button>
                            <Button variant="outline" onClick={() => setStatus('not-connected')}>
                                <RefreshCwIcon data-icon="inline-start" />
                                إعادة ضبط الحالة
                            </Button>
                        </div>

                        {status === 'not-connected' ? (
                            <Alert>
                                <SparklesIcon />
                                <AlertTitle>اربط Gmail أولًا</AlertTitle>
                                <AlertDescription>
                                    بعد الربط ستظهر حالة الفحص والنتائج هنا تلقائيًا.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {status === 'queued' ? (
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-base">تمت إضافة الفحص للطابور</CardTitle>
                                    <CardDescription>جاري تجهيز الاتصال مع Gmail...</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={20} />
                                    <div className="mt-4">
                                        <Button variant="secondary" onClick={() => setStatus('in-progress')}>
                                            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                                            متابعة التقدم
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {status === 'in-progress' ? (
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-base">الفحص قيد التنفيذ</CardTitle>
                                    <CardDescription>تمت معالجة 327 رسالة حتى الآن.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <Progress value={72} />
                                    <div className="flex flex-wrap gap-2">
                                        <Badge>in_progress</Badge>
                                        <Badge variant="secondary">327 / 500 رسالة</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => setStatus('completed')}>
                                            إنهاء الفحص (حالة تجريبية)
                                        </Button>
                                        <Button variant="outline" onClick={() => setStatus('failed')}>
                                            تجربة حالة الفشل
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {status === 'completed' ? (
                            <Alert>
                                <CheckCircle2Icon />
                                <AlertTitle>اكتمل الفحص</AlertTitle>
                                <AlertDescription className="flex flex-wrap items-center gap-3">
                                    <span>تم العثور على 8 اشتراكات جديدة. يمكنك مراجعتها الآن.</span>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={review()}>عرض المراجعة</Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {status === 'failed' ? (
                            <Alert variant="destructive">
                                <AlertTitle>فشل الفحص</AlertTitle>
                                <AlertDescription>
                                    حدث خطأ أثناء الوصول إلى Gmail. أعد المحاولة بعد قليل.
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
