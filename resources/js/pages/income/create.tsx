import { Head, Link, useForm } from '@inertiajs/react';
import { PlusCircleIcon, SaveIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { create, index, store } from '@/routes/income';

type Option = { slug: string; label: string };

export type IncomeCreateProps = {
    defaults: {
        currency: 'EGP' | 'USD';
        date: string;
    };
    categories: Option[];
    source_labels: Option[];
};

type FormValues = {
    amount: string;
    currency: 'EGP' | 'USD';
    date: string;
    source_label: string;
    client_name: string;
    category: string;
    description: string;
};

export default function IncomeCreate({ defaults, categories, source_labels }: IncomeCreateProps) {
    const initialCategory = useMemo(() => categories[0]?.slug ?? 'freelance', [categories]);

    const { data, setData, post, processing, errors } = useForm<FormValues>({
        amount: '',
        currency: defaults.currency ?? 'EGP',
        date: defaults.date ?? new Date().toISOString().slice(0, 10),
        source_label: 'other',
        client_name: '',
        category: initialCategory,
        description: '',
    });

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        post(store.url());
    }

    return (
        <>
            <Head title="إضافة إيراد يدوي" />
            <div className="bg-background min-h-svh px-4 py-8">
                <div className="mx-auto w-full max-w-3xl">
                    <Card className="overflow-hidden border">
                        <div className="bg-primary h-1.5 w-full" />
                        <CardHeader className="gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-2xl">إضافة إيراد يدوي</CardTitle>
                                    <CardDescription>
                                        سجل إيراداتك من المصادر الخارجية مثل Upwork، فوري، أو التحويلات البنكية.
                                    </CardDescription>
                                </div>
                                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                                    <PlusCircleIcon className="size-5" />
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="amount">المبلغ</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            placeholder="0.00"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            aria-invalid={errors.amount !== undefined}
                                        />
                                        {errors.amount ? (
                                            <p className="text-destructive text-sm">{errors.amount}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="date">تاريخ الاستلام</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            aria-invalid={errors.date !== undefined}
                                        />
                                        {errors.date ? (
                                            <p className="text-destructive text-sm">{errors.date}</p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label>العملة</Label>
                                        <ToggleGroup
                                            type="single"
                                            value={data.currency}
                                            onValueChange={(value) =>
                                                value && setData('currency', value as 'EGP' | 'USD')}
                                            className="justify-start"
                                        >
                                            <ToggleGroupItem value="EGP">EGP</ToggleGroupItem>
                                            <ToggleGroupItem value="USD">USD</ToggleGroupItem>
                                        </ToggleGroup>
                                        {errors.currency ? (
                                            <p className="text-destructive text-sm">{errors.currency}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>مصدر الدخل</Label>
                                        <Select
                                            value={data.source_label}
                                            onValueChange={(value) => setData('source_label', value)}
                                        >
                                            <SelectTrigger aria-invalid={errors.source_label !== undefined}>
                                                <SelectValue placeholder="اختر مصدر الدخل" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {source_labels.map((opt) => (
                                                        <SelectItem key={opt.slug} value={opt.slug}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.source_label ? (
                                            <p className="text-destructive text-sm">{errors.source_label}</p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="client_name">اسم العميل (اختياري)</Label>
                                        <Input
                                            id="client_name"
                                            placeholder="اسم العميل أو الشركة"
                                            value={data.client_name}
                                            onChange={(e) => setData('client_name', e.target.value)}
                                        />
                                        {errors.client_name ? (
                                            <p className="text-destructive text-sm">{errors.client_name}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>التصنيف</Label>
                                        <Select
                                            value={data.category}
                                            onValueChange={(value) => setData('category', value)}
                                        >
                                            <SelectTrigger aria-invalid={errors.category !== undefined}>
                                                <SelectValue placeholder="اختر التصنيف" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {categories.map((opt) => (
                                                        <SelectItem key={opt.slug} value={opt.slug}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {errors.category ? (
                                            <p className="text-destructive text-sm">{errors.category}</p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description">الوصف / الملاحظات (اختياري)</Label>
                                    <Textarea
                                        id="description"
                                        rows={4}
                                        placeholder="أضف أي تفاصيل إضافية مرتبطة بالإيراد..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                    />
                                    {errors.description ? (
                                        <p className="text-destructive text-sm">{errors.description}</p>
                                    ) : null}
                                </div>

                                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={index()}>إلغاء</Link>
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        <SaveIcon data-icon="inline-start" />
                                        حفظ الإيراد
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

IncomeCreate.layout = {
    breadcrumbs: [
        {
            title: 'الإيرادات',
            href: index(),
        },
        {
            title: 'إضافة إيراد',
            href: create(),
        },
    ],
};
