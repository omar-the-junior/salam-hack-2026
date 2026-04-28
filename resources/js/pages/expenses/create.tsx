import { Head, Link } from '@inertiajs/react';
import { ArrowRightIcon, CalendarDaysIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { create, index } from '@/routes/expenses';

export default function ExpensesCreate() {
    const [type, setType] = useState<'recurring' | 'one-time'>('recurring');

    return (
        <>
            <Head title="إضافة مصروف" />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <Button asChild variant="ghost" className="w-fit px-2">
                        <Link href={index()}>
                            <ArrowRightIcon data-icon="inline-start" />
                            عودة إلى المصروفات
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold tracking-tight">إضافة مصروف يدوي</h1>
                    <p className="text-muted-foreground text-sm">
                        أدخل تفاصيل المصروف لمتابعة التجديدات والمقارنة مع الدخل الشهري.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>بيانات المصروف</CardTitle>
                        <CardDescription>واجهة تصميم فقط - الحفظ غير متصل بقاعدة بيانات.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name">اسم الخدمة أو المصروف</Label>
                            <Input id="name" placeholder="مثال: اشتراك برنامج تصميم" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="category">التصنيف</Label>
                                <Select defaultValue="saas">
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="اختر التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="saas">SaaS</SelectItem>
                                            <SelectItem value="tool">أداة</SelectItem>
                                            <SelectItem value="equipment">معدات</SelectItem>
                                            <SelectItem value="marketing">تسويق</SelectItem>
                                            <SelectItem value="other">أخرى</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">نوع المصروف</Label>
                                <Select value={type} onValueChange={(value) => setType(value as 'recurring' | 'one-time')}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="اختر النوع" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="recurring">متكرر</SelectItem>
                                            <SelectItem value="one-time">مرة واحدة</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">المبلغ</Label>
                                <Input id="amount" placeholder="0.00" type="number" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="currency">العملة</Label>
                                <Select defaultValue="egp">
                                    <SelectTrigger id="currency">
                                        <SelectValue placeholder="اختر العملة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="egp">EGP</SelectItem>
                                            <SelectItem value="usd">USD</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="billing">دورة الفوترة</Label>
                                <Select defaultValue={type === 'one-time' ? 'one-time' : 'monthly'}>
                                    <SelectTrigger id="billing" disabled={type === 'one-time'}>
                                        <SelectValue placeholder="اختر دورة الفوترة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="monthly">شهري</SelectItem>
                                            <SelectItem value="annual">سنوي</SelectItem>
                                            <SelectItem value="one-time">مرة واحدة</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="renewal">تاريخ التجديد القادم</Label>
                                <div className="relative">
                                    <CalendarDaysIcon className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                                    <Input id="renewal" type="date" className="pr-10" disabled={type === 'one-time'} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="started_at">تاريخ البداية</Label>
                                <Input id="started_at" type="date" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="alert_days_before">التنبيه قبل التجديد (بالأيام)</Label>
                                <Input id="alert_days_before" type="number" defaultValue={7} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="cancel_url">رابط الإلغاء (اختياري)</Label>
                            <Input id="cancel_url" type="url" placeholder="https://..." />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">ملاحظات</Label>
                            <Textarea id="notes" placeholder="أي تفاصيل إضافية..." className="min-h-24" />
                        </div>

                        <Separator />

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">متكرر = يتطلب تاريخ تجديد</Badge>
                            <Badge variant="outline">مرة واحدة = بدون دورة</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button>
                                <PlusIcon data-icon="inline-start" />
                                حفظ المصروف
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={index()}>إلغاء</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ExpensesCreate.layout = {
    breadcrumbs: [
        {
            title: 'المصروفات',
            href: index(),
        },
        {
            title: 'إضافة مصروف',
            href: create(),
        },
    ],
};
