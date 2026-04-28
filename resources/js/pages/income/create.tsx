import { Head, Link } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { PlusCircleIcon, SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { create, index } from '@/routes/income';

type IncomeCreateFormValues = {
    amount: string;
    currency: 'EGP' | 'USD';
    date: string;
    source_label: string;
    client_name: string;
    category: string;
    description: string;
};

export default function IncomeCreate() {
    const form = useForm<IncomeCreateFormValues>({
        defaultValues: {
            amount: '',
            currency: 'EGP',
            date: new Date().toISOString().slice(0, 10),
            source_label: '',
            client_name: '',
            category: '',
            description: '',
        },
    });

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
                            <Form {...form}>
                                <form className="flex flex-col gap-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>المبلغ</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            placeholder="0.00"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>تاريخ الاستلام</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="date" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>العملة</FormLabel>
                                                    <FormControl>
                                                        <ToggleGroup
                                                            type="single"
                                                            value={field.value}
                                                            onValueChange={(value) => value && field.onChange(value)}
                                                            className="justify-start"
                                                        >
                                                            <ToggleGroupItem value="EGP">EGP</ToggleGroupItem>
                                                            <ToggleGroupItem value="USD">USD</ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="source_label"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>مصدر الدخل</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="اختر مصدر الدخل" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="upwork">Upwork</SelectItem>
                                                                <SelectItem value="fiverr">Fiverr</SelectItem>
                                                                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                                                                <SelectItem value="fawry">فوري</SelectItem>
                                                                <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                                                                <SelectItem value="other">أخرى</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="client_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>اسم العميل (اختياري)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="اسم العميل أو الشركة" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>التصنيف</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="اختر التصنيف" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="freelance">عمل حر</SelectItem>
                                                                <SelectItem value="product_sale">بيع منتج</SelectItem>
                                                                <SelectItem value="consulting">استشارات</SelectItem>
                                                                <SelectItem value="content">صناعة محتوى</SelectItem>
                                                                <SelectItem value="other">أخرى</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>الوصف / الملاحظات (اختياري)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                        placeholder="أضف أي تفاصيل إضافية مرتبطة بالإيراد..."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                                        <Button type="button" variant="outline" asChild>
                                            <Link href={index()}>إلغاء</Link>
                                        </Button>
                                        <Button type="submit">
                                            <SaveIcon data-icon="inline-start" />
                                            حفظ الإيراد
                                        </Button>
                                    </div>
                                </form>
                            </Form>
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
