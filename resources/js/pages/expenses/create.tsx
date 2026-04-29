import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRightIcon, CalendarDaysIcon, PlusIcon } from 'lucide-react';
import { useEffect } from 'react';
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
import { create, index, store } from '@/routes/expenses';

type Props = {
    preferred_currency: 'EGP' | 'USD';
};

type FormValues = {
    name: string;
    category: string;
    type: 'recurring' | 'one-time';
    amount: string;
    currency: 'EGP' | 'USD';
    billing_cycle: string;
    next_renewal_date: string;
    started_at: string;
    alert_days_before: string;
    cancel_url: string;
    notes: string;
};

export default function ExpensesCreate({ preferred_currency }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormValues>({
        name: '',
        category: 'saas',
        type: 'recurring',
        amount: '',
        currency: preferred_currency,
        billing_cycle: 'monthly',
        next_renewal_date: '',
        started_at: '',
        alert_days_before: '7',
        cancel_url: '',
        notes: '',
    });

    useEffect(() => {
        setData('currency', preferred_currency);
    }, [preferred_currency, setData]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        post(store.url());
    }

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
                        <CardDescription>سيتم حفظ البطاقة بحالة «نشط».</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                            <div className="grid gap-2">
                                <Label htmlFor="name">اسم الخدمة أو المصروف</Label>
                                <Input
                                    id="name"
                                    placeholder="مثال: اشتراك برنامج تصميم"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    aria-invalid={errors.name !== undefined}
                                />
                                {errors.name ? <p className="text-destructive text-sm">{errors.name}</p> : null}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">التصنيف</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) => setData('category', value)}
                                    >
                                        <SelectTrigger id="category" aria-invalid={errors.category !== undefined}>
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
                                    {errors.category ? (
                                        <p className="text-destructive text-sm">{errors.category}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">نوع المصروف</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) => {
                                            const t = value as FormValues['type'];
                                            setData('type', t);
                                            if (t === 'one-time') {
                                                setData('billing_cycle', 'one-time');
                                                setData('next_renewal_date', '');
                                            } else {
                                                setData('billing_cycle', 'monthly');
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="type" aria-invalid={errors.type !== undefined}>
                                            <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="recurring">متكرر</SelectItem>
                                                <SelectItem value="one-time">مرة واحدة</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.type ? <p className="text-destructive text-sm">{errors.type}</p> : null}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">المبلغ</Label>
                                    <Input
                                        id="amount"
                                        placeholder="0.00"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        aria-invalid={errors.amount !== undefined}
                                    />
                                    {errors.amount ? (
                                        <p className="text-destructive text-sm">{errors.amount}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">العملة</Label>
                                    <Select
                                        value={data.currency}
                                        onValueChange={(value) => setData('currency', value as 'EGP' | 'USD')}
                                    >
                                        <SelectTrigger id="currency" aria-invalid={errors.currency !== undefined}>
                                            <SelectValue placeholder="اختر العملة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="EGP">EGP</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.currency ? (
                                        <p className="text-destructive text-sm">{errors.currency}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="billing">دورة الفوترة</Label>
                                    <Select
                                        value={data.billing_cycle}
                                        onValueChange={(value) => setData('billing_cycle', value)}
                                        disabled={data.type === 'one-time'}
                                    >
                                        <SelectTrigger
                                            id="billing"
                                            aria-invalid={errors.billing_cycle !== undefined}
                                        >
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
                                    {errors.billing_cycle ? (
                                        <p className="text-destructive text-sm">{errors.billing_cycle}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="renewal">تاريخ التجديد القادم</Label>
                                    <div className="relative">
                                        <CalendarDaysIcon className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            id="renewal"
                                            type="date"
                                            className="pr-10"
                                            disabled={data.type === 'one-time'}
                                            value={data.next_renewal_date}
                                            onChange={(e) => setData('next_renewal_date', e.target.value)}
                                            aria-invalid={errors.next_renewal_date !== undefined}
                                        />
                                    </div>
                                    {errors.next_renewal_date ? (
                                        <p className="text-destructive text-sm">{errors.next_renewal_date}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="started_at">تاريخ البداية</Label>
                                    <Input
                                        id="started_at"
                                        type="date"
                                        value={data.started_at}
                                        onChange={(e) => setData('started_at', e.target.value)}
                                        aria-invalid={errors.started_at !== undefined}
                                    />
                                    {errors.started_at ? (
                                        <p className="text-destructive text-sm">{errors.started_at}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="alert_days_before">التنبيه قبل التجديد (بالأيام)</Label>
                                    <Input
                                        id="alert_days_before"
                                        type="number"
                                        min={0}
                                        value={data.alert_days_before}
                                        onChange={(e) => setData('alert_days_before', e.target.value)}
                                        disabled={data.type === 'one-time'}
                                        aria-invalid={errors.alert_days_before !== undefined}
                                    />
                                    {errors.alert_days_before ? (
                                        <p className="text-destructive text-sm">{errors.alert_days_before}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cancel_url">رابط الإلغاء (اختياري)</Label>
                                <Input
                                    id="cancel_url"
                                    type="url"
                                    placeholder="https://..."
                                    value={data.cancel_url}
                                    onChange={(e) => setData('cancel_url', e.target.value)}
                                    aria-invalid={errors.cancel_url !== undefined}
                                />
                                {errors.cancel_url ? (
                                    <p className="text-destructive text-sm">{errors.cancel_url}</p>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">ملاحظات</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="أي تفاصيل إضافية..."
                                    className="min-h-24"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    aria-invalid={errors.notes !== undefined}
                                />
                                {errors.notes ? <p className="text-destructive text-sm">{errors.notes}</p> : null}
                            </div>

                            <Separator />

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">متكرر = يتطلب تاريخ تجديد</Badge>
                                <Badge variant="outline">مرة واحدة = بدون دورة</Badge>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={processing}>
                                    <PlusIcon data-icon="inline-start" />
                                    حفظ المصروف
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={index()}>إلغاء</Link>
                                </Button>
                            </div>
                        </form>
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
