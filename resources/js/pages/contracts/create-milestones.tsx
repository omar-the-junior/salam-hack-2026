/* eslint-disable react-hooks/incompatible-library -- react-hook-form watch() drives milestone totals */
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDaysIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { ContractWizardStepper } from '@/components/contracts/contract-wizard-stepper';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { create, edit, index } from '@/routes/contracts';
import { summary as summaryRoute } from '@/routes/contracts/create';

function parseYmdToDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

function formatDateToYmd(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatOptionalMilestoneDueLabel(value: string, emptyLabel: string): string {
    const date = parseYmdToDate(value);

    if (!date) {
        return emptyLabel;
    }

    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function parsePercentageInput(raw: string): number {
    const normalized = raw.trim().replace(',', '.');
    const n = Number.parseFloat(normalized);

    return Number.isNaN(n) ? Number.NaN : n;
}

function FieldRow({ children }: { children: ReactNode }): ReactElement {
    return <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start">{children}</div>;
}

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
    /** Decimal string so the input can stay empty while editing (avoids stuck `0`). */
    percentage: string;
    due_date: string;
};

type MilestonesFormValues = {
    milestones: MilestoneDraft[];
};

export default function ContractsCreateMilestones({ contract }: ContractsCreateMilestonesProps) {
    const [processing, setProcessing] = useState(false);
    const [dueDatePopoverOpen, setDueDatePopoverOpen] = useState<Record<string, boolean>>({});

    const contractTotal = contract ? Number.parseFloat(contract.total_value) : 0;

    const form = useForm<MilestonesFormValues>({
        defaultValues: {
            milestones: [
                { title: '', percentage: '', due_date: '' },
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
            milestones.reduce((sum, m) => {
                const n = parsePercentageInput(m.percentage);

                return sum + (Number.isNaN(n) ? 0 : n);
            }, 0),
        [milestones],
    );
    const remainingPercentage = Math.max(0, 100 - allocatedPercentage);

    const addMilestone = () => {
        if (fields.length >= 5) {
            return;
        }

        append({ title: '', percentage: '', due_date: '' });
    };

    const onSubmit = form.handleSubmit((values) => {
        if (!contract) {
            return;
        }

        setProcessing(true);
        const payload = {
            milestones: values.milestones.map((m) => ({
                title: m.title,
                percentage: parsePercentageInput(m.percentage),
                due_date: m.due_date === '' ? null : m.due_date,
            })),
        };
        router.post(`/contracts/${contract.id}/milestones/bulk`, payload, {
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
                        <CardTitle className="text-2xl md:text-3xl">إنشاء عقد جديد</CardTitle>
                        <ContractWizardStepper currentStep={2} contractId={contract.id} />
                        <p className="text-muted-foreground max-w-xl text-sm">
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
                                    {fields.map((row, index) => {
                                        const parsedPct = parsePercentageInput(milestones[index]?.percentage ?? '');
                                        const percentageForAmount = Number.isNaN(parsedPct) ? 0 : parsedPct;
                                        const amount = contractTotal * (percentageForAmount / 100);

                                        return (
                                            <Card key={row.id} className="bg-background/90">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-base">مرحلة #{index + 1}</CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="min-h-11 min-w-11"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length === 1}
                                                            aria-label="حذف المرحلة"
                                                        >
                                                            <Trash2Icon />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="flex flex-col gap-4">
                                                    <FieldRow>
                                                        <FormField
                                                            control={form.control}
                                                            name={`milestones.${index}.title`}
                                                            rules={{ required: 'عنوان المرحلة مطلوب' }}
                                                            render={({ field: titleField }) => (
                                                                <FormItem className="flex-1">
                                                                    <FormLabel>عنوان المرحلة</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...titleField} className="min-h-11 bg-background/90" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`milestones.${index}.percentage`}
                                                            rules={{
                                                                validate: (value) => {
                                                                    const trimmed = value.trim();

                                                                    if (trimmed === '') {
                                                                        return 'النسبة مطلوبة';
                                                                    }

                                                                    const n = parsePercentageInput(value);

                                                                    if (Number.isNaN(n)) {
                                                                        return 'أدخل رقماً صالحاً للنسبة.';
                                                                    }

                                                                    if (n < 0.01) {
                                                                        return 'يجب أن تكون النسبة أكبر من 0.';
                                                                    }

                                                                    if (n > 100) {
                                                                        return 'يجب ألا تتجاوز النسبة 100%.';
                                                                    }

                                                                    return true;
                                                                },
                                                            }}
                                                            render={({ field: percentageField }) => (
                                                                <FormItem className="w-full md:max-w-36">
                                                                    <FormLabel>النسبة المئوية %</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...percentageField}
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            autoComplete="off"
                                                                            placeholder="مثال: 50"
                                                                            className="min-h-11 bg-background/90"
                                                                            value={percentageField.value}
                                                                            onChange={(event) => {
                                                                                percentageField.onChange(event.target.value);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </FieldRow>
                                                    <Separator />
                                                    <FieldRow>
                                                        <FormItem className="flex-1">
                                                            <FormLabel>المبلغ (تلقائي)</FormLabel>
                                                            <FormControl>
                                                                <div className="flex min-h-11 items-center rounded-md border border-dashed bg-background/90 px-3 text-sm font-medium">
                                                                    {new Intl.NumberFormat('ar-EG').format(amount)}{' '}
                                                                    {contract.currency}
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                        <FormField
                                                            control={form.control}
                                                            name={`milestones.${index}.due_date`}
                                                            render={({ field: dueDateInput }) => (
                                                                <FormItem className="flex-1">
                                                                    <FormLabel>تاريخ الاستحقاق (اختياري)</FormLabel>
                                                                    <Popover
                                                                        open={dueDatePopoverOpen[row.id] ?? false}
                                                                        onOpenChange={(nextOpen) => {
                                                                            setDueDatePopoverOpen((prev) => ({
                                                                                ...prev,
                                                                                [row.id]: nextOpen,
                                                                            }));
                                                                        }}
                                                                    >
                                                                        <PopoverTrigger asChild>
                                                                            <FormControl>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    className="bg-background/90 min-h-11 w-full justify-between font-normal"
                                                                                    ref={dueDateInput.ref}
                                                                                    name={dueDateInput.name}
                                                                                    onBlur={dueDateInput.onBlur}
                                                                                >
                                                                                    <span>
                                                                                        {formatOptionalMilestoneDueLabel(
                                                                                            dueDateInput.value,
                                                                                            'اختر تاريخ الاستحقاق',
                                                                                        )}
                                                                                    </span>
                                                                                    <CalendarDaysIcon data-icon="inline-end" />
                                                                                </Button>
                                                                            </FormControl>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-0" align="end">
                                                                            <Calendar
                                                                                mode="single"
                                                                                selected={parseYmdToDate(dueDateInput.value)}
                                                                                onSelect={(date) => {
                                                                                    dueDateInput.onChange(
                                                                                        date ? formatDateToYmd(date) : '',
                                                                                    );
                                                                                    setDueDatePopoverOpen((prev) => ({
                                                                                        ...prev,
                                                                                        [row.id]: false,
                                                                                    }));
                                                                                }}
                                                                                captionLayout="dropdown"
                                                                            />
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </FieldRow>
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

                    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button type="button" variant="outline" asChild>
                                <Link href={edit.url({ contract: contract.id })} prefetch>
                                    السابق: البيانات الأساسية
                                </Link>
                            </Button>
                            <Button type="button" variant="ghost" className="text-muted-foreground" asChild>
                                <Link
                                    href={summaryRoute.url({
                                        query: { contract_id: contract.id },
                                    })}
                                    prefetch
                                >
                                    تخطي إلى الملخص والإنهاء
                                </Link>
                            </Button>
                        </div>
                        <Button type="submit" form="milestones-form" disabled={processing} className="min-h-11">
                            {processing ? 'جارٍ الحفظ…' : 'التالي: الملخص والإنهاء'}
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
