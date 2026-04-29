import { Head, router } from '@inertiajs/react';
/* eslint-disable react-hooks/incompatible-library -- react-hook-form watch() drives dependent fields in this form */
import { CalendarDaysIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { store as customersStore } from '@/routes/customers';
import { create, index, store } from '@/routes/payment-links';

type PaymentLinkDefaults = {
    currency: 'EGP' | 'USD';
    tax_rate: number;
};

type MilestoneOption = {
    id: string;
    title: string;
    amount: string;
    due_date: string | null;
};

type ContractWithMilestones = {
    id: string;
    project_name: string;
    client_name: string;
    client_email: string;
    currency: string;
    tax_rate: string;
    milestones: MilestoneOption[];
};

type PaymentLinksCreateProps = {
    defaults: PaymentLinkDefaults;
    customers: CustomerOption[];
    newCustomerId?: string | null;
    contractsWithMilestones: ContractWithMilestones[];
    selectedMilestoneId: string | null;
};

type PaymentLinkFormData = {
    milestone_id: string;
    customer_id: string;
    amount: string;
    currency: 'EGP' | 'USD';
    description: string;
    client_name: string;
    client_email: string;
    due_date: string;
    tax_rate: string;
};

type CustomerOption = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
};

function formatAmount(value: number, currency: 'EGP' | 'USD'): string {
    const safeCurrency = currency === 'USD' ? 'USD' : 'EGP';

    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 2,
    }).format(value);
}

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

function formatDateLabel(value: string): string {
    const date = parseYmdToDate(value);

    if (!date) {
        return 'اختر تاريخ الاستحقاق';
    }

    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function findMilestoneContext(
    contracts: ContractWithMilestones[],
    milestoneId: string,
): { contract: ContractWithMilestones; milestone: MilestoneOption } | null {
    for (const contract of contracts) {
        const milestone = contract.milestones.find((m) => m.id === milestoneId);

        if (milestone) {
            return { contract, milestone };
        }
    }

    return null;
}

function paymentLinkCurrency(contractCurrency: string): 'EGP' | 'USD' {
    if (contractCurrency === 'USD') {
        return 'USD';
    }
    return 'EGP';
}

export default function PaymentLinksCreate({
    defaults,
    customers,
    newCustomerId = null,
    contractsWithMilestones,
    selectedMilestoneId,
}: PaymentLinksCreateProps) {
    const [processing, setProcessing] = useState(false);
    const [dueDateOpen, setDueDateOpen] = useState(false);
    const [newCustomerOpen, setNewCustomerOpen] = useState(false);
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [customerErrors, setCustomerErrors] = useState<{
        name?: string;
        email?: string;
    }>({});
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        email: '',
    });
    const form = useForm<PaymentLinkFormData>({
        defaultValues: {
            milestone_id: selectedMilestoneId ?? '',
            customer_id: '',
            amount: '',
            currency: defaults.currency === 'USD' ? 'USD' : 'EGP',
            description: '',
            client_name: '',
            client_email: '',
            due_date: '',
            tax_rate: String(defaults.tax_rate ?? 0),
        },
    });
    const { control, setError, handleSubmit, setValue, watch } = form;

    const customerIdValue = watch('customer_id');
    const amountValue = watch('amount');
    const taxRateValue = watch('tax_rate');
    const currencyValue = watch('currency');
    const customersById = useMemo(() => {
        return new Map(customers.map((customer) => [customer.id, customer]));
    }, [customers]);

    const applyMilestonePrefill = useCallback(
        (milestoneId: string) => {
            const ctx = findMilestoneContext(contractsWithMilestones, milestoneId);

            if (!ctx) {
                return;
            }

            const { contract, milestone } = ctx;

            setValue('amount', String(milestone.amount));
            setValue('currency', paymentLinkCurrency(contract.currency));
            setValue('tax_rate', String(contract.tax_rate ?? 0));
            setValue('client_name', contract.client_name);
            setValue('client_email', contract.client_email);
            setValue('due_date', milestone.due_date ?? '');
            setValue('description', `دفعة — ${milestone.title}`);
        },
        [contractsWithMilestones, setValue],
    );

    useEffect(() => {
        if (!selectedMilestoneId) {
            return;
        }

        applyMilestonePrefill(selectedMilestoneId);
    }, [selectedMilestoneId, applyMilestonePrefill]);

    const subtotal = Number.parseFloat(amountValue);
    const taxRate = Number.parseFloat(taxRateValue);
    const safeSubtotal = Number.isNaN(subtotal) ? 0 : subtotal;
    const safeTaxRate = Number.isNaN(taxRate) ? 0 : taxRate;
    const taxAmount = safeSubtotal * safeTaxRate / 100;
    const total = safeSubtotal + taxAmount;

    useEffect(() => {
        if (!newCustomerId) {
            return;
        }

        const createdCustomer = customersById.get(newCustomerId);

        if (!createdCustomer) {
            return;
        }

        setValue('customer_id', createdCustomer.id);
        setValue('client_name', createdCustomer.name);
        setValue('client_email', createdCustomer.email);
    }, [customersById, newCustomerId, setValue]);

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

    const submit = handleSubmit((values) => {
        setProcessing(true);
        router.post(store.url(), values, {
            preserveScroll: true,
            onError: (errors) => {
                const entries = Object.entries(errors);
                entries.forEach(([key, message]) => {
                    if (key in values) {
                        setError(key as keyof PaymentLinkFormData, {
                            type: 'server',
                            message,
                        });
                    }
                });
            },
            onFinish: () => setProcessing(false),
        });
    });

    const submitNewCustomer = (): void => {
        setCreatingCustomer(true);
        setCustomerErrors({});

        router.post(customersStore.url(), { ...newCustomerData, context: 'payment-link' }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setNewCustomerOpen(false);
                setNewCustomerData({
                    name: '',
                    email: '',
                });
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
    };

    return (
        <>
            <Head title="إنشاء رابط دفع" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 text-right">
                <Card>
                    <CardHeader>
                        <CardTitle>إنشاء رابط دفع</CardTitle>
                        <CardDescription>قم بإعداد تفاصيل الدفع لإرسالها إلى عميلك.</CardDescription>
                    </CardHeader>
                </Card>

                <Form {...form}>
                    <form onSubmit={submit} className="grid items-start gap-4 lg:grid-cols-12">
                        <div className="flex flex-col gap-4 lg:col-span-8">
                            {contractsWithMilestones.length === 0 ? (
                                <Alert variant="destructive">
                                    <AlertTitle>لا توجد مراحل</AlertTitle>
                                    <AlertDescription>
                                        أضف عقداً ومراحل دفع أولاً من صفحة العقود قبل إنشاء رابط دفع مرتبط بمرحلة.
                                    </AlertDescription>
                                </Alert>
                            ) : null}
                            <Card>
                                <CardHeader>
                                    <CardTitle>العقد والمرحلة</CardTitle>
                                    <CardDescription>
                                        اختر المشروع (العقد) والمرحلة التي يخصّص لها رابط الدفع هذا.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={control}
                                        name="milestone_id"
                                        rules={{ required: 'يرجى اختيار مرحلة' }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>مرحلة الدفع</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        applyMilestonePrefill(value);
                                                    }}
                                                    disabled={contractsWithMilestones.length === 0}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-10 w-full">
                                                            <SelectValue placeholder="اختر عقداً ومرحلة..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {contractsWithMilestones.map((contract) => (
                                                            <SelectGroup key={contract.id}>
                                                                <SelectLabel className="text-start">
                                                                    {contract.project_name} · {contract.client_name}
                                                                </SelectLabel>
                                                                {contract.milestones.map((milestone) => (
                                                                    <SelectItem key={milestone.id} value={milestone.id}>
                                                                        {milestone.title} ({milestone.amount})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    كل رابط دفع يجب أن يكون مرتبطاً بمرحلة واحدة ضمن أحد عقودك.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>تفاصيل المبلغ</CardTitle>
                                    <CardDescription>أدخل بيانات المبلغ والضريبة والوصف.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={control}
                                            name="amount"
                                            rules={{ required: 'المبلغ مطلوب' }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>المبلغ قبل الضريبة</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            className="h-10"
                                                            min={0.01}
                                                            step={0.01}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="tax_rate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>نسبة الضريبة %</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            className="h-10"
                                                            min={0}
                                                            max={100}
                                                            step={0.01}
                                                            placeholder="0"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>العملة</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10">
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
                                        <div className="flex items-end">
                                            <FormDescription>
                                                يمكن ترك نسبة الضريبة 0 إذا لم تكن هناك ضريبة.
                                            </FormDescription>
                                        </div>
                                    </div>

                                    <FormField
                                        control={control}
                                        name="description"
                                        rules={{ required: 'الوصف مطلوب' }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>الوصف (اختياري)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        className="min-h-24"
                                                        placeholder="وصف الخدمة أو المنتج..."
                                                        required
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>العميل والاستحقاق</CardTitle>
                                    <CardDescription>اختر عميل أو أضف عميل جديد وحدد تاريخ الاستحقاق.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                                        <FormField
                                            control={control}
                                            name="customer_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>اختر عميل من القائمة</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder="اختياري: اختر عميل محفوظ" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {customers.map((customer) => (
                                                                    <SelectItem key={customer.id} value={customer.id}>
                                                                        {customer.name} — {customer.email}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        عند اختيار عميل، سيتم تعبئة الاسم والبريد تلقائياً.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="outline" className="mt-8 h-10">
                                                    إضافة عميل جديد
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>إضافة عميل جديد</DialogTitle>
                                                    <DialogDescription>
                                                        احفظ بيانات العميل ليظهر في القائمة مباشرة.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="new_customer_name">اسم العميل</Label>
                                                        <Input
                                                            id="new_customer_name"
                                                            value={newCustomerData.name}
                                                            onChange={(event) =>
                                                                setNewCustomerData((previous) => ({
                                                                    ...previous,
                                                                    name: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                        {customerErrors.name ? (
                                                            <p className="text-sm text-destructive">
                                                                {customerErrors.name}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="new_customer_email">البريد الإلكتروني</Label>
                                                        <Input
                                                            id="new_customer_email"
                                                            type="email"
                                                            value={newCustomerData.email}
                                                            onChange={(event) =>
                                                                setNewCustomerData((previous) => ({
                                                                    ...previous,
                                                                    email: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                        {customerErrors.email ? (
                                                            <p className="text-sm text-destructive">
                                                                {customerErrors.email}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setNewCustomerOpen(false)}
                                                    >
                                                        إلغاء
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        disabled={creatingCustomer}
                                                        onClick={submitNewCustomer}
                                                    >
                                                        حفظ العميل
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={control}
                                            name="client_name"
                                            rules={{ required: 'اسم العميل مطلوب' }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>اسم العميل</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="h-10" required />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="client_email"
                                            rules={{ required: 'بريد العميل مطلوب' }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>البريد الإلكتروني للعميل</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" className="h-10" required />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={control}
                                        name="due_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>تاريخ الاستحقاق</FormLabel>
                                                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-10 w-full justify-between font-normal"
                                                            >
                                                                <span>{formatDateLabel(field.value)}</span>
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
                                                                setDueDateOpen(false);
                                                            }}
                                                            captionLayout="dropdown"
                                                            disabled={(date) => {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);

                                                                return date < today;
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-4 lg:col-span-4">
                            <Card className="lg:sticky lg:top-6">
                                <CardHeader>
                                    <CardTitle>ملخص الدفع</CardTitle>
                                    <CardDescription>مراجعة سريعة قبل الإنشاء.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>المبلغ الفرعي</span>
                                        <span className="font-medium">
                                            {formatAmount(safeSubtotal, currencyValue)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>الضريبة ({safeTaxRate}%)</span>
                                        <span className="font-medium">{formatAmount(taxAmount, currencyValue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-3">
                                        <span className="font-medium">الإجمالي</span>
                                        <span className="text-lg font-semibold">
                                            {formatAmount(total, currencyValue)}
                                        </span>
                                    </div>

                                    <Button type="submit" disabled={processing || contractsWithMilestones.length === 0}>
                                        إنشاء رابط الدفع
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}

PaymentLinksCreate.layout = {
    breadcrumbs: [
        {
            title: 'روابط الدفع',
            href: index(),
        },
        {
            title: 'إنشاء',
            href: create(),
        },
    ],
};
