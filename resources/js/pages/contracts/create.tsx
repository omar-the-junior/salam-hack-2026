import { Head, Link, router } from '@inertiajs/react';
/* eslint-disable react-hooks/incompatible-library -- react-hook-form watch() drives end-date constraints */
import { CalendarDaysIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ContractWizardStepper } from '@/components/contracts/contract-wizard-stepper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { index, store, update } from '@/routes/contracts';
import { store as customersStore } from '@/routes/customers';

const MANUAL_CUSTOMER_VALUE = '__manual__';

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

const DATE_END_BEFORE_START_MESSAGE =
    'تاريخ الانتهاء يجب أن يكون في أو بعد تاريخ البدء.';
const DATE_START_AFTER_END_MESSAGE =
    'تاريخ البدء يجب أن يكون في أو قبل تاريخ الانتهاء.';

function datesBothSet(startYmd: string, endYmd: string): boolean {
    return Boolean(startYmd && endYmd);
}

function isEndBeforeStartYmd(startYmd: string, endYmd: string): boolean {
    return datesBothSet(startYmd, endYmd) && endYmd < startYmd;
}

function formatOptionalContractDateLabel(value: string, emptyLabel: string): string {
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

type ContractCreateFormValues = {
    project_name: string;
    description: string;
    customer_id: string;
    client_name: string;
    client_email: string;
    total_value: string;
    tax_rate: string;
    currency: string;
    start_date: string;
    end_date: string;
};

type ContractCreateDefaults = {
    tax_rate: number;
};

type CustomerOption = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
};

type ContractEditPayload = {
    id: string;
    project_name: string;
    description: string;
    client_name: string;
    client_email: string;
    total_value: string;
    tax_rate: string;
    currency: string;
    start_date: string;
    end_date: string;
    milestones_count: number;
};

export default function ContractsCreate({
    mode = 'create',
    contract = null,
    initialCustomerId = '',
    defaults,
    customers,
    newCustomerId = null,
}: {
    mode?: 'create' | 'edit';
    contract?: ContractEditPayload | null;
    initialCustomerId?: string;
    defaults: ContractCreateDefaults;
    customers: CustomerOption[];
    newCustomerId?: string | null;
}) {
    const [processing, setProcessing] = useState(false);
    const [newCustomerOpen, setNewCustomerOpen] = useState(false);
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [customerErrors, setCustomerErrors] = useState<{
        name?: string;
        email?: string;
    }>({});
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    const newCustomerForm = useForm<{ name: string; email: string }>({
        defaultValues: {
            name: '',
            email: '',
        },
    });

    const defaultFormValues = useMemo((): ContractCreateFormValues => {
        if (mode === 'edit' && contract) {
            return {
                project_name: contract.project_name,
                description: contract.description ?? '',
                customer_id: initialCustomerId,
                client_name: contract.client_name,
                client_email: contract.client_email,
                total_value: contract.total_value,
                tax_rate: contract.tax_rate,
                currency: contract.currency,
                start_date: contract.start_date ?? '',
                end_date: contract.end_date ?? '',
            };
        }

        return {
            project_name: '',
            description: '',
            customer_id: '',
            client_name: '',
            client_email: '',
            total_value: '',
            tax_rate: String(defaults.tax_rate ?? 0),
            currency: 'EGP',
            start_date: '',
            end_date: '',
        };
    }, [contract, defaults.tax_rate, initialCustomerId, mode]);

    const form = useForm<ContractCreateFormValues>({
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        form.reset(defaultFormValues);
    }, [defaultFormValues, form]);

    const { setError, setValue, trigger, watch } = form;
    const customerIdValue = watch('customer_id');
    const startDateValue = watch('start_date');
    const endDateValue = watch('end_date');

    useEffect(() => {
        void trigger(['start_date', 'end_date']);
    }, [startDateValue, endDateValue, trigger]);

    const customersById = useMemo(() => {
        return new Map(customers.map((customer) => [customer.id, customer]));
    }, [customers]);

    useEffect(() => {
        if (!customerIdValue) {
            return;
        }

        const selectedCustomer = customersById.get(customerIdValue);

        if (!selectedCustomer) {
            return;
        }

        setValue('client_name', selectedCustomer.name);
        setValue('client_email', selectedCustomer.email);
    }, [customerIdValue, customersById, setValue]);

    useEffect(() => {
        if (!newCustomerId) {
            return;
        }

        const createdCustomer = customersById.get(newCustomerId);

        if (!createdCustomer) {
            return;
        }

        setValue('customer_id', newCustomerId);
        setValue('client_name', createdCustomer.name);
        setValue('client_email', createdCustomer.email);
    }, [customersById, newCustomerId, setValue]);

    const submitNewCustomer = newCustomerForm.handleSubmit((data): void => {
        setCreatingCustomer(true);
        setCustomerErrors({});

        router.post(customersStore.url(), { ...data, context: 'contract' }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setNewCustomerOpen(false);
                newCustomerForm.reset();
            },
            onError: (errors) => {
                setCustomerErrors({
                    name: errors.name,
                    email: errors.email,
                });
            },
            onFinish: () => {
                setCreatingCustomer(false);
            },
        });
    });

    const onSubmit = form.handleSubmit((values) => {
        const { customer_id, ...payload } = values;
        void customer_id;

        setProcessing(true);

        if (mode === 'edit' && contract) {
            router.put(
                update.url({ contract: contract.id }),
                { ...payload, continue_wizard: true },
                {
                    onError: (errors) => {
                        Object.entries(errors).forEach(([key, message]) => {
                            if (key === 'continue_wizard') {
                                return;
                            }

                            if (key in payload) {
                                setError(key as keyof ContractCreateFormValues, {
                                    type: 'server',
                                    message,
                                });
                            }
                        });
                    },
                    onFinish: () => setProcessing(false),
                },
            );

            return;
        }

        router.post(store.url(), payload, {
            onError: (errors) => {
                Object.entries(errors).forEach(([key, message]) => {
                    if (key in payload) {
                        setError(key as keyof ContractCreateFormValues, {
                            type: 'server',
                            message,
                        });
                    }
                });
            },
            onFinish: () => setProcessing(false),
        });
    });

    const pageTitle =
        mode === 'edit'
            ? 'إنشاء عقد: تعديل البيانات الأساسية'
            : 'إنشاء عقد: بيانات المشروع';

    const primarySubmitLabel =
        processing
            ? 'جارٍ الحفظ…'
            : mode === 'edit'
              ? 'حفظ والمتابعة إلى المراحل'
              : 'التالي: بناء مراحل الدفع';

    return (
        <>
            <Head title={pageTitle} />
            <div className="bg-surface min-h-svh px-4 py-8 pb-16 md:py-10">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <CardTitle className="text-2xl md:text-3xl">
                            {mode === 'edit' ? 'تعديل بيانات العقد' : 'إنشاء عقد جديد'}
                        </CardTitle>
                        <ContractWizardStepper
                            currentStep={1}
                            contractId={contract?.id ?? null}
                        />
                    </div>

                    {mode === 'edit' && contract && contract.milestones_count > 0 ? (
                        <Alert>
                            <AlertTitle>تعديل القيمة أو الضريبة</AlertTitle>
                            <AlertDescription>
                                يوجد {contract.milestones_count}{' '}
                                مراحل دفع مرتبطة بهذا العقد. تغيير القيمة الإجمالية أو نسبة الضريبة قد لا يحدّث مبالغ
                                المراحل المحفوظة تلقائياً — راجع المبالغ بعد الحفظ.
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    <Card className="border-sand bg-papyrus shadow-sm">
                        <CardHeader>
                            <CardTitle>تفاصيل المشروع والعميل</CardTitle>
                            <CardDescription>
                                املأ البيانات الأساسية قبل تقسيم الدفعات على المراحل.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            <Form {...form}>
                                <form id="contract-create-form" onSubmit={onSubmit} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-muted-foreground text-sm font-medium">المشروع</h3>
                                            <Separator />
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <FormField
                                                control={form.control}
                                                name="project_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>اسم المشروع</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="مثال: تطوير منصة تجارة إلكترونية"
                                                                className="bg-background/90 min-h-11"
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
                                                    <FormItem>
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
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-muted-foreground text-sm font-medium">العميل</h3>
                                            <Separator />
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto] md:items-start md:gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="customer_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>اختر عميلاً محفوظاً</FormLabel>
                                                            <Select
                                                                value={field.value === '' ? MANUAL_CUSTOMER_VALUE : field.value}
                                                                onValueChange={(value) => {
                                                                    field.onChange(value === MANUAL_CUSTOMER_VALUE ? '' : value);
                                                                }}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-background/90 min-h-11">
                                                                        <SelectValue placeholder="إدخال يدوي أو اختيار من القائمة" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectItem value={MANUAL_CUSTOMER_VALUE}>إدخال يدوي</SelectItem>
                                                                        {customers.map((customerItem) => (
                                                                            <SelectItem key={customerItem.id} value={customerItem.id}>
                                                                                {customerItem.name} — {customerItem.email}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription>
                                                                عند اختيار عميل، يتم تعبئة الاسم والبريد تلقائياً ويمكنك تعديلهما قبل الحفظ.
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button type="button" variant="outline" className="min-h-11 w-full shrink-0 md:mt-8 md:w-auto">
                                                            إضافة عميل جديد
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>إضافة عميل جديد</DialogTitle>
                                                            <DialogDescription>
                                                                احفظ بيانات العميل ليظهر في قائمتك ويمكن ربطه بهذا العقد.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <Form {...newCustomerForm}>
                                                            <div className="flex flex-col gap-4">
                                                                <FormField
                                                                    control={newCustomerForm.control}
                                                                    name="name"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>اسم العميل</FormLabel>
                                                                            <FormControl>
                                                                                <Input {...field} autoComplete="name" className="bg-background/90 min-h-11" />
                                                                            </FormControl>
                                                                            {customerErrors.name ? (
                                                                                <p className="text-destructive text-sm">{customerErrors.name}</p>
                                                                            ) : (
                                                                                <FormMessage />
                                                                            )}
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={newCustomerForm.control}
                                                                    name="email"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>البريد الإلكتروني</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    {...field}
                                                                                    type="email"
                                                                                    autoComplete="email"
                                                                                    className="bg-background/90 min-h-11"
                                                                                />
                                                                            </FormControl>
                                                                            {customerErrors.email ? (
                                                                                <p className="text-destructive text-sm">{customerErrors.email}</p>
                                                                            ) : (
                                                                                <FormMessage />
                                                                            )}
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </Form>
                                                        <DialogFooter>
                                                            <Button type="button" variant="outline" onClick={() => setNewCustomerOpen(false)}>
                                                                إلغاء
                                                            </Button>
                                                            <Button type="button" disabled={creatingCustomer} onClick={submitNewCustomer}>
                                                                حفظ العميل
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="client_name"
                                                    rules={{ required: 'اسم العميل مطلوب' }}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>اسم العميل</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="اسم العميل أو الشركة" className="bg-background/90 min-h-11" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="client_email"
                                                    rules={{ required: 'البريد الإلكتروني للعميل مطلوب' }}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>البريد الإلكتروني للعميل</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="email" placeholder="client@example.com" className="bg-background/90 min-h-11" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-muted-foreground text-sm font-medium">التمويل والعملة</h3>
                                            <Separator />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <FormField
                                                control={form.control}
                                                name="total_value"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>القيمة الإجمالية قبل الضريبة</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} type="number" min={0} step={0.01} placeholder="0.00" className="bg-background/90 min-h-11" />
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
                                                            <Input {...field} type="number" min={0} max={100} step={0.01} placeholder="0" className="bg-background/90 min-h-11" />
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
                                                                <SelectTrigger className="bg-background/90 min-h-11">
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
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-muted-foreground text-sm font-medium">الجدول الزمني</h3>
                                            <Separator />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="start_date"
                                                rules={{
                                                    validate: (value) =>
                                                        isEndBeforeStartYmd(value, endDateValue)
                                                            ? DATE_START_AFTER_END_MESSAGE
                                                            : true,
                                                }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>تاريخ البدء (اختياري)</FormLabel>
                                                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="bg-background/90 min-h-11 w-full justify-between font-normal"
                                                                    >
                                                                        <span>
                                                                            {formatOptionalContractDateLabel(
                                                                                field.value,
                                                                                'اختر تاريخ البدء',
                                                                            )}
                                                                        </span>
                                                                        <CalendarDaysIcon data-icon="inline-end" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="end">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={parseYmdToDate(field.value)}
                                                                    onSelect={(date) => {
                                                                        field.onChange(date ? formatDateToYmd(date) : '');
                                                                        setStartDateOpen(false);
                                                                    }}
                                                                    captionLayout="dropdown"
                                                                    disabled={(date) => {
                                                                        const end = parseYmdToDate(endDateValue);

                                                                        if (!end) {
                                                                            return false;
                                                                        }

                                                                        const dayEnd = new Date(end);
                                                                        dayEnd.setHours(0, 0, 0, 0);
                                                                        const candidate = new Date(date);
                                                                        candidate.setHours(0, 0, 0, 0);

                                                                        return candidate > dayEnd;
                                                                    }}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="end_date"
                                                rules={{
                                                    validate: (value) =>
                                                        isEndBeforeStartYmd(startDateValue, value)
                                                            ? DATE_END_BEFORE_START_MESSAGE
                                                            : true,
                                                }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>تاريخ الانتهاء (اختياري)</FormLabel>
                                                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="bg-background/90 min-h-11 w-full justify-between font-normal"
                                                                    >
                                                                        <span>
                                                                            {formatOptionalContractDateLabel(
                                                                                field.value,
                                                                                'اختر تاريخ الانتهاء',
                                                                            )}
                                                                        </span>
                                                                        <CalendarDaysIcon data-icon="inline-end" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="end">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={parseYmdToDate(field.value)}
                                                                    onSelect={(date) => {
                                                                        field.onChange(date ? formatDateToYmd(date) : '');
                                                                        setEndDateOpen(false);
                                                                    }}
                                                                    captionLayout="dropdown"
                                                                    disabled={(date) => {
                                                                        const start = parseYmdToDate(startDateValue);

                                                                        if (!start) {
                                                                            return false;
                                                                        }

                                                                        const dayStart = new Date(start);
                                                                        dayStart.setHours(0, 0, 0, 0);
                                                                        const candidate = new Date(date);
                                                                        candidate.setHours(0, 0, 0, 0);

                                                                        return candidate < dayStart;
                                                                    }}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <Button type="button" variant="outline" asChild>
                            <Link href={index()}>العودة إلى العقود</Link>
                        </Button>
                        <Button type="submit" form="contract-create-form" disabled={processing}>
                            {primarySubmitLabel}
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
