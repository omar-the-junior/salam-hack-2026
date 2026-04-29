import { Head, Link, router } from '@inertiajs/react';
import { CircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index, store } from '@/routes/contracts';

type ContractCreateFormValues = {
    project_name: string;
    description: string;
    client_name: string;
    client_email: string;
    total_value: string;
    tax_rate: string;
    currency: string;
    start_date: string;
    end_date: string;
};

export default function ContractsCreate() {
    const [processing, setProcessing] = useState(false);

    const form = useForm<ContractCreateFormValues>({
        defaultValues: {
            project_name: '',
            description: '',
            client_name: '',
            client_email: '',
            total_value: '',
            tax_rate: '',
            currency: 'EGP',
            start_date: '',
            end_date: '',
        },
    });

    const onSubmit = form.handleSubmit((values) => {
        setProcessing(true);
        router.post(store.url(), values, {
            onError: (errors) => {
                Object.entries(errors).forEach(([key, message]) => {
                    if (key in values) {
                        form.setError(key as keyof ContractCreateFormValues, {
                            type: 'server',
                            message,
                        });
                    }
                });
            },
            onFinish: () => setProcessing(false),
        });
    });

    return (
        <>
            <Head title="إنشاء عقد: بيانات المشروع" />
            <div className="bg-surface min-h-svh px-4 py-10">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <CardTitle className="text-3xl">إنشاء عقد جديد</CardTitle>
                        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-3 text-sm">
                            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                                1
                            </span>
                            <span className="text-primary font-semibold">
                                الخطوة 1 من 3: تفاصيل المشروع والعميل
                            </span>
                            <span className="text-muted-foreground/60">—</span>
                            <span className="flex items-center gap-1">
                                <CircleIcon className="size-3" />
                                بناء مراحل الدفع
                            </span>
                            <span className="text-muted-foreground/60">—</span>
                            <span className="flex items-center gap-1">
                                <CircleIcon className="size-3" />
                                الشروط والمراجعة
                            </span>
                        </div>
                    </div>

                    <Card className="border-sand bg-papyrus shadow-sm">
                        <CardHeader>
                            <CardTitle>تفاصيل المشروع والعميل</CardTitle>
                            <CardDescription>
                                املأ البيانات الأساسية قبل تقسيم الدفعات على المراحل.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <Form {...form}>
                                <form id="contract-create-form" onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="project_name"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>اسم المشروع</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="مثال: تطوير منصة تجارة إلكترونية"
                                                        className="bg-background/90"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>وصف المشروع (اختياري)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                        placeholder="نبذة قصيرة عن نطاق العمل..."
                                                        className="bg-background/90"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="client_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>اسم العميل</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="اسم العميل أو الشركة" className="bg-background/90" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="client_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>البريد الإلكتروني للعميل</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder="client@example.com" className="bg-background/90" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="total_value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>القيمة الإجمالية قبل الضريبة</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="number" min={0} step={0.01} placeholder="0.00" className="bg-background/90" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tax_rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>نسبة الضريبة % (اختياري)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="number" min={0} max={100} step={0.01} placeholder="0" className="bg-background/90" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>العملة</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/90">
                                                            <SelectValue placeholder="اختر العملة" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                                                            <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="start_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>تاريخ البدء (اختياري)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="date" className="bg-background/90" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_date"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>تاريخ الانتهاء (اختياري)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="date" className="bg-background/90" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <Button type="button" variant="outline" asChild>
                            <Link href={index()}>السابق</Link>
                        </Button>
                        <Button type="submit" form="contract-create-form" disabled={processing}>
                            {processing ? 'جارٍ الحفظ…' : 'التالي: بناء مراحل الدفع'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

ContractsCreate.layout = {
    breadcrumbs: [
        {
            title: 'العقود',
            href: index(),
        },
        {
            title: 'إنشاء عقد · الخطوة 1',
            href: '/contracts/create',
        },
    ],
};
