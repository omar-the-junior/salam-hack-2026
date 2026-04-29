import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2Icon, CircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { create, index } from '@/routes/contracts';

type ContractSummary = {
    id: string;
    project_name: string;
    total_value: string;
    currency: string;
};

type ContractsCreateMilestonesProps = {
    contract: ContractSummary | null;
};

type MilestoneDraft = {
    title: string;
    percentage: number;
    due_date: string;
};

type MilestonesFormValues = {
    milestones: MilestoneDraft[];
};

export default function ContractsCreateMilestones({ contract }: ContractsCreateMilestonesProps) {
    const [processing, setProcessing] = useState(false);

    const contractTotal = contract ? Number.parseFloat(contract.total_value) : 0;

    const form = useForm<MilestonesFormValues>({
        defaultValues: {
            milestones: [
                { title: '', percentage: 0, due_date: '' },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'milestones',
    });

    const milestones = form.watch('milestones');

    const allocatedPercentage = useMemo(
        () => milestones.reduce((sum, m) => sum + (Number.isNaN(m.percentage) ? 0 : m.percentage), 0),
        [milestones],
    );
    const remainingPercentage = Math.max(0, 100 - allocatedPercentage);

    const addMilestone = () => {
        if (fields.length >= 5) return;
        append({ title: '', percentage: 0, due_date: '' });
    };

    const onSubmit = form.handleSubmit((values) => {
        if (!contract) return;

        setProcessing(true);
        router.post(`/contracts/${contract.id}/milestones/bulk`, values, {
            onError: (errors) => {
                Object.entries(errors).forEach(([key, message]) => {
                    const match = key.match(/^milestones\.(\d+)\.(.+)$/);
                    if (match) {
                        form.setError(`milestones.${match[1]}.${match[2]}` as keyof MilestonesFormValues, {
                            type: 'server',
                            message,
                        });
                    }
                });
            },
            onFinish: () => setProcessing(false),
        });
    });

    if (!contract) {
        return (
            <>
                <Head title="إنشاء عقد: بناء المراحل" />
                <div className="bg-surface min-h-svh px-4 py-10">
                    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
                        <CardTitle className="text-3xl">لم يتم تحديد عقد</CardTitle>
                        <p className="text-muted-foreground">يرجى البدء من الخطوة الأولى.</p>
                        <Button asChild>
                            <Link href={create()}>ابدأ من الخطوة الأولى</Link>
                        </Button>
                    </div>
                </div>
            </>
        );
    }

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
                        <p className="text-muted-foreground text-sm">
                            {contract.project_name} · إجمالي العقد:{' '}
                            {new Intl.NumberFormat('ar-EG', {
                                style: 'currency',
                                currency: contract.currency === 'USD' ? 'USD' : 'EGP',
                                minimumFractionDigits: 2,
                            }).format(contractTotal)}
                        </p>
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
                                <form id="milestones-form" onSubmit={onSubmit} className="flex flex-col gap-4">
                                    {fields.map((field, index) => {
                                        const percentage = milestones[index]?.percentage ?? 0;
                                        const amount = contractTotal * (percentage / 100);

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
                                                        rules={{ required: 'عنوان المرحلة مطلوب' }}
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
                                                        rules={{ required: 'النسبة مطلوبة', min: { value: 0.01, message: 'يجب أن تكون النسبة أكبر من 0' } }}
                                                        render={({ field: percentageField }) => (
                                                            <FormItem>
                                                                <FormLabel>النسبة المئوية %</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        max={100}
                                                                        step={0.01}
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
                                                                {new Intl.NumberFormat('ar-EG').format(amount)}{' '}
                                                                {contract.currency}
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
                            <Link href={index()}>تخطي الآن (أضف المراحل لاحقاً)</Link>
                        </Button>
                        <Button type="submit" form="milestones-form" disabled={processing}>
                            {processing ? 'جارٍ الحفظ…' : 'التالي: الشروط والمراجعة'}
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
