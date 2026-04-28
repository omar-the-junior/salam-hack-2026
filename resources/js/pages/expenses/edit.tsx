import { Head, Link } from '@inertiajs/react';
import { ArrowRightIcon, CalendarDaysIcon, SaveIcon } from 'lucide-react';
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
import { edit, index } from '@/routes/expenses';

export default function ExpensesEdit() {
    const [type, setType] = useState<'recurring' | 'one-time'>('recurring');

    return (
        <>
            <Head title="تعديل مصروف" />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <Button asChild variant="ghost" className="w-fit px-2">
                        <Link href={index()}>
                            <ArrowRightIcon data-icon="inline-start" />
                            عودة إلى المصروفات
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold tracking-tight">تعديل المصروف</h1>
                    <p className="text-muted-foreground text-sm">
                        قم بتحديث بيانات المصروف أو معلومات التجديد عند الحاجة.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>بيانات المصروف</CardTitle>
                        <CardDescription>نموذج UI مع بيانات تجريبية (Figma Pro).</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name">اسم الخدمة أو المصروف</Label>
                            <Input id="name" defaultValue="Figma Pro" />
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
                                <Input id="amount" type="number" defaultValue={15} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="currency">العملة</Label>
                                <Select defaultValue="usd">
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
                                    <Input id="renewal" type="date" defaultValue="2026-05-03" className="pr-10" disabled={type === 'one-time'} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="started_at">تاريخ البداية</Label>
                                <Input id="started_at" type="date" defaultValue="2025-11-03" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="alert_days_before">التنبيه قبل التجديد (بالأيام)</Label>
                                <Input id="alert_days_before" type="number" defaultValue={7} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="cancel_url">رابط الإلغاء</Label>
                            <Input id="cancel_url" type="url" defaultValue="https://www.figma.com/account/billing/" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">ملاحظات</Label>
                            <Textarea id="notes" defaultValue="الإلغاء في منتصف الدورة لا يعيد المبلغ." className="min-h-24" />
                        </div>

                        <Separator />

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>نشط</Badge>
                            <Badge variant="secondary">مكتشف تلقائيًا</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button>
                                <SaveIcon data-icon="inline-start" />
                                حفظ التعديلات
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

ExpensesEdit.layout = {
    breadcrumbs: [
        {
            title: 'المصروفات',
            href: index(),
        },
        {
            title: 'تعديل',
            href: edit(1),
        },
    ],
};
