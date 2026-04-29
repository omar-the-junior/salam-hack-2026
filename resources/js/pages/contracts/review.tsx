import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2Icon, PenLineIcon } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { accept } from '@/routes/contracts';

type MilestonePublic = {
    id: string;
    title: string;
    percentage: string;
    amount: string;
    due_date: string | null;
};

type UserBrief = {
    id: string;
    name: string;
    display_name: string | null;
};

type ContractReview = {
    id: string;
    contract_token: string;
    project_name: string;
    description: string | null;
    client_name: string;
    total_value: string;
    tax_rate: string;
    tax_amount: string;
    grand_total: string;
    currency: string;
    terms: string | null;
    status: string;
    signed_at: string | null;
    milestones: MilestonePublic[];
    user: UserBrief;
};

function formatMoney(value: string | number, currency: string): string {
    const n = typeof value === 'string' ? Number.parseFloat(value) : value;
    const safeCurrency = currency === 'USD' ? 'USD' : 'EGP';
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 2,
    }).format(Number.isNaN(n) ? 0 : n);
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }
    return new Date(value).toLocaleDateString('ar-EG', {
        dateStyle: 'long',
    });
}

function formatSignedAt(value: string | null): string {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString('ar-EG', {
        dateStyle: 'long',
        timeStyle: 'short',
    });
}

export default function ContractsReview({
    contract,
}: {
    contract: ContractReview;
}) {
    const { flash } = usePage().props;
    const freelancerName =
        contract.user.display_name ?? contract.user.name ?? '—';

    const form = useForm({ agreed: false });

    const taxRateNum = Number.parseFloat(contract.tax_rate);
    const isSigned = contract.status === 'active';
    const flashMsg =
        flash && typeof flash === 'object' && 'message' in flash
            ? (flash as { message?: string }).message
            : undefined;

    return (
        <div className="min-h-svh bg-muted/30">
            <Head title="مراجعة العقد" />
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 md:px-6">
                    <AppLogo className="h-8" />
                    <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs"
                    >
                        بانتظار الموافقة
                    </Badge>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 pb-32 md:px-6">
                {flashMsg ? (
                    <Alert>
                        <AlertTitle>تنبيه</AlertTitle>
                        <AlertDescription>{flashMsg}</AlertDescription>
                    </Alert>
                ) : null}

                {isSigned ? (
                    <Alert className="border-primary/30 bg-primary/5">
                        <CheckCircle2Icon />
                        <AlertTitle>تم توقيع هذا العقد مسبقاً</AlertTitle>
                        <AlertDescription>
                            تاريخ التوقيع: {formatSignedAt(contract.signed_at)}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="text-center">
                    <h1 className="text-2xl font-semibold leading-snug md:text-3xl">
                        مراجعة العقد: {contract.project_name}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        بين {freelancerName} (المستقل) و {contract.client_name}{' '}
                        (العميل)
                    </p>
                </div>

                <article className="flex flex-col gap-10 rounded-2xl border bg-card p-5 shadow-sm md:p-8">
                    <div className="flex items-start justify-between border-b pb-6">
                        <div className="flex size-16 items-center justify-center rounded-lg border bg-muted/40">
                            <AppLogo className="h-6" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">
                                رقم العقد
                            </p>
                            <p className="font-medium">
                                #{contract.contract_token}
                            </p>
                        </div>
                    </div>

                    <Card className="border-muted/80 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">
                                وصف المشروع
                            </CardTitle>
                            <CardDescription>
                                التفاصيل الأساسية لنطاق التنفيذ المتفق عليه
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 text-sm">
                            <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {contract.description ?? 'لا يوجد وصف مضاف.'}
                            </p>
                            <p>
                                إجمالي القيمة قبل الضريبة:{' '}
                                <span className="font-semibold text-foreground">
                                    {formatMoney(
                                        contract.total_value,
                                        contract.currency,
                                    )}
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-muted/80 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">
                                جدول الدفعات (المراحل)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">
                                                المرحلة
                                            </TableHead>
                                            <TableHead className="text-right">
                                                النسبة
                                            </TableHead>
                                            <TableHead className="text-right">
                                                القيمة
                                            </TableHead>
                                            <TableHead className="text-right">
                                                تاريخ الاستحقاق
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contract.milestones.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    لا توجد مراحل مضافة بعد.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            contract.milestones.map((m) => (
                                                <TableRow key={m.id}>
                                                    <TableCell>
                                                        {m.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        {m.percentage}%
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatMoney(
                                                            m.amount,
                                                            contract.currency,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {m.due_date
                                                            ? formatDate(
                                                                  m.due_date,
                                                              )
                                                            : 'فوري'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {taxRateNum > 0 ? (
                        <div className="flex justify-end">
                            <Card className="w-full border-muted/80 shadow-none md:w-2/3">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        الملخص المالي
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            المجموع الفرعي
                                        </span>
                                        <span>
                                            {formatMoney(
                                                contract.total_value,
                                                contract.currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            ضريبة القيمة المضافة (
                                            {contract.tax_rate}%)
                                        </span>
                                        <span>
                                            {formatMoney(
                                                contract.tax_amount,
                                                contract.currency,
                                            )}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-end justify-between">
                                        <span className="font-semibold">
                                            الإجمالي المطلوب
                                        </span>
                                        <span className="text-lg font-bold text-primary">
                                            {formatMoney(
                                                contract.grand_total,
                                                contract.currency,
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}

                    {contract.terms ? (
                        <Card className="border-muted/80 shadow-none">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    الشروط والأحكام
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                    {contract.terms}
                                </p>
                            </CardContent>
                        </Card>
                    ) : null}
                </article>

                {!isSigned ? (
                    <>
                        <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 backdrop-blur md:p-5">
                            <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="agreed"
                                        checked={form.data.agreed}
                                        onCheckedChange={(c) =>
                                            form.setData('agreed', c === true)
                                        }
                                        aria-invalid={
                                            !!form.errors.agreed || undefined
                                        }
                                    />
                                    <Label
                                        htmlFor="agreed"
                                        className="text-sm leading-snug font-normal"
                                    >
                                        أوافق على جميع شروط العقد
                                    </Label>
                                </div>
                                {form.errors.agreed ? (
                                    <p className="text-sm text-destructive">
                                        {form.errors.agreed}
                                    </p>
                                ) : null}
                                <Button
                                    type="button"
                                    disabled={
                                        !form.data.agreed || form.processing
                                    }
                                    onClick={() =>
                                        form.post(
                                            accept.url(contract.contract_token),
                                        )
                                    }
                                >
                                    <PenLineIcon data-icon="inline-start" />
                                    قبول وتوقيع العقد
                                </Button>
                            </div>
                        </footer>
                    </>
                ) : null}
            </main>
        </div>
    );
}
