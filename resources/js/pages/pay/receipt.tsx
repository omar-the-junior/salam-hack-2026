import { Head } from '@inertiajs/react';
import { CheckCircle2Icon, CopyIcon, DownloadIcon } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PayReceipt() {
    return (
        <>
            <Head title="الإيصال" />
            <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center gap-6 bg-muted/20 p-4">
                <div className="flex justify-center">
                    <AppLogo className="h-8" />
                </div>
                <Card className="overflow-hidden border-border/80 shadow-lg">
                    <div className="h-2 bg-emerald-500" />
                    <CardHeader className="items-center border-b text-center">
                        <CheckCircle2Icon className="size-16 text-emerald-600" />
                        <CardTitle>تم الدفع بنجاح</CardTitle>
                        <CardDescription>
                            تم تأكيد استلام الدفعة واكتمال المعاملة.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">رقم المرجع</p>
                                <p className="text-sm font-medium" dir="ltr">MST-123456</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">تاريخ الدفع</p>
                                <p className="text-sm font-medium">15 أكتوبر 2023، 14:30 بتوقيت الرياض</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">تفاصيل الخدمة</p>
                            <p className="text-sm text-muted-foreground">
                                الدفعة النهائية لمشروع تطوير وتصميم الهوية البصرية.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">المبلغ الأساسي</span>
                                <span dir="ltr">5,000.00 ر.س</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
                                <span dir="ltr">750.00 ر.س</span>
                            </div>
                            <Separator className="border-dashed" />
                            <div className="flex items-end justify-between">
                                <span className="font-medium">إجمالي المبلغ المدفوع</span>
                                <span className="text-2xl font-bold text-primary" dir="ltr">5,750.00 ر.س</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="button" className="flex-1">
                                <DownloadIcon data-icon="inline-start" />
                                تحميل الإيصال PDF
                            </Button>
                            <Button type="button" variant="outline" className="flex-1">
                                <CopyIcon data-icon="inline-start" />
                                نسخ رابط الإيصال
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <div className="text-center text-sm text-muted-foreground">
                    مُسْتَحَقّ - نظام التشغيل المالي للمستقلين
                </div>
            </div>
        </>
    );
}

PayReceipt.layout = {
    title: 'الإيصال',
    description: 'شكراً لك على الدفع (مسودة)',
};
