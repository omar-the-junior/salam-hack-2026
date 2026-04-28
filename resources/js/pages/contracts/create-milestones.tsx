import { Head, Link } from '@inertiajs/react';
import { CheckCircle2Icon, CircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { index } from '@/routes/contracts';

type MilestoneDraft = {
    title: string;
    percentage: number;
    due_date: string;
};

type MilestonesFormValues = {
    milestones: MilestoneDraft[];
};

const CONTRACT_TOTAL = 10000;

export default function ContractsCreateMilestones() {
    const form = useForm<MilestonesFormValues>({
        defaultValues: {
            milestones: [
                {
                    title: 'توقيع العقد',
                    percentage: 30,
                    due_date: '2026-05-15',
                },
                {
                    title: 'تسليم النسخة الأولى',
                    percentage: 30,
                    due_date: '2026-05-28',
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'milestones',
    });

    const milestones = form.watch('milestones');

    const allocatedPercentage = useMemo(
        () =>
            milestones.reduce(
                (sum, milestone) => sum + (Number.isNaN(milestone.percentage) ? 0 : milestone.percentage),
                0,
            ),
        [milestones],
    );
    const remainingPercentage = Math.max(0, 100 - allocatedPercentage);

    const addMilestone = () => {
        if (fields.length >= 5) {
            return;
        }

        append({ title: '', percentage: 0, due_date: '' });
    };

    return (
        <>
            <Head title="إنشاء عقد: بناء المراحل" />
            <div className="bg-surface min-h-svh px-4 py-10">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <CardTitle className="text-3xl">إنشاء عقد جديد</CardTitle>
                        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                                <CheckCircle2Icon className="size-4 text-primary" />
                                تفاصيل المشروع والعميل
                            </span>
                            <span className="text-muted-foreground/60">—</span>
                            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                                2
                            </span>
                            <span className="text-primary font-semibold">
                                الخطوة 2 من 3: بناء مراحل الدفع
                            </span>
                            <span className="text-muted-foreground/60">—</span>
                            <span className="flex items-center gap-1">
                                <CircleIcon className="size-3" />
                                الشروط والمراجعة
                            </span>
                        </div>
                    </div>

                    <Card className="border-sand bg-papyrus shadow-sm">
                        <CardHeader className="text-right">
                            <div className="flex items-center justify-between">
                                <CardTitle>نسبة التوزيع</CardTitle>
                                <span className="text-sm font-semibold text-primary">{allocatedPercentage}%</span>
                            </div>
                            <CardDescription>يجب أن يصل إجمالي التوزيع إلى 100% للمتابعة.</CardDescription>
                            <Progress value={Math.min(allocatedPercentage, 100)} />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Form {...form}>
                                <form className="flex flex-col gap-4">
                                    {fields.map((field, index) => {
                                        const percentage = milestones[index]?.percentage ?? 0;
                                        const amount = CONTRACT_TOTAL * (percentage / 100);

                                        return (
                                            <Card key={field.id} className="bg-background/90">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-base">مرحلة #{index + 1}</CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length === 1}
                                                        >
                                                            <Trash2Icon />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`milestones.${index}.title`}
                                                        render={({ field: titleField }) => (
                                                            <FormItem>
                                                                <FormLabel>عنوان المرحلة</FormLabel>
                                                                <FormControl>
                                                                    <Input {...titleField} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`milestones.${index}.percentage`}
                                                        render={({ field: percentageField }) => (
                                                            <FormItem>
                                                                <FormLabel>النسبة المئوية %</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        max={100}
                                                                        value={percentageField.value}
                                                                        onChange={(event) =>
                                                                            percentageField.onChange(
                                                                                Number.parseFloat(event.target.value || '0'),
                                                                            )
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormItem>
                                                        <FormLabel>المبلغ (تلقائي)</FormLabel>
                                                        <FormControl>
                                                            <div className="flex h-10 items-center rounded-md border border-dashed px-3 text-sm font-medium">
                                                                {new Intl.NumberFormat('ar-EG').format(amount)} ج.م
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormField
                                                        control={form.control}
                                                        name={`milestones.${index}.due_date`}
                                                        render={({ field: dueDateField }) => (
                                                            <FormItem>
                                                                <FormLabel>تاريخ الاستحقاق</FormLabel>
                                                                <FormControl>
                                                                    <Input {...dueDateField} type="date" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </form>
                            </Form>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addMilestone}
                                disabled={fields.length >= 5}
                                className="border-dashed"
                            >
                                <PlusIcon data-icon="inline-start" />
                                إضافة مرحلة دفع (المتبقي: {remainingPercentage}%)
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/contracts/create">السابق</Link>
                        </Button>
                        <Button type="button" asChild>
                            <Link href={index()}>التالي: الشروط والمراجعة</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

ContractsCreateMilestones.layout = {
    breadcrumbs: [
        {
            title: 'العقود',
            href: index(),
        },
        {
            title: 'إنشاء عقد · الخطوة 2',
            href: '/contracts/create/milestones',
        },
    ],
};
