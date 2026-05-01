import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2Icon, PenLineIcon, ShieldCheckIcon } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
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

    const form = useForm({ agreed: false, signature_code: '' });

    const taxRateNum = Number.parseFloat(contract.tax_rate);
    const isSigned = contract.status === 'active';
    const flashMsg =
        flash && typeof flash === 'object' && 'message' in flash
            ? (flash as { message?: string }).message
            : undefined;

    return (
        <div className="min-h-svh bg-muted/30">
            <Head title="مراجعة العقد" />
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-3 sm:h-16 sm:px-4 md:px-6">
                    <AppLogo className="h-7 sm:h-8" />
                    <Badge
                        variant={isSigned ? 'outline' : 'secondary'}
                        className={cn(
                            'rounded-full px-3 py-1 text-xs',
                            isSigned && 'border-primary/40 text-primary',
                        )}
                    >
                        {isSigned ? 'موقّع' : 'بانتظار الموافقة'}
                    </Badge>
                </div>
            </header>

            <main
                className={cn(
                    'mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-8 md:px-6',
                    !isSigned &&
                        'pb-[calc(13rem+env(safe-area-inset-bottom,0))] sm:pb-[calc(14rem+env(safe-area-inset-bottom,0))]',
                    isSigned && 'pb-6 sm:pb-8',
                )}
            >
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
                    <h1 className="text-xl font-semibold leading-snug sm:text-2xl md:text-3xl">
                        مراجعة العقد: {contract.project_name}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        بين {freelancerName} (المستقل) و {contract.client_name}{' '}
                        (العميل)
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                        رقم المرجع{' '}
                        <span
                            className="font-mono font-medium text-foreground"
                            dir="ltr"
                        >
                            #{contract.contract_token}
                        </span>
                    </p>
                </div>

                <article className="flex flex-col gap-6 rounded-2xl border bg-card p-4 shadow-sm md:gap-10 md:p-8">
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
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex flex-col gap-3 md:hidden">
                                {contract.milestones.length === 0 ? (
                                    <p className="py-2 text-center text-sm text-muted-foreground">
                                        لا توجد مراحل مضافة بعد.
                                    </p>
                                ) : (
                                    contract.milestones.map((m) => (
                                        <Card
                                            key={m.id}
                                            className="gap-0 border-muted/80 py-3 shadow-none"
                                        >
                                            <CardHeader className="gap-1 px-4 pb-2 pt-0">
                                                <CardTitle className="text-start text-base leading-snug">
                                                    {m.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-2 px-4 pb-0 pt-0 text-sm">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">
                                                        النسبة
                                                    </span>
                                                    <span className="tabular-nums font-medium">
                                                        {m.percentage}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">
                                                        القيمة
                                                    </span>
                                                    <span className="tabular-nums font-medium">
                                                        {formatMoney(
                                                            m.amount,
                                                            contract.currency,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">
                                                        تاريخ الاستحقاق
                                                    </span>
                                                    <span className="text-start text-muted-foreground">
                                                        {m.due_date
                                                            ? formatDate(
                                                                  m.due_date,
                                                              )
                                                            : 'فوري'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            <div className="hidden overflow-x-auto rounded-lg border md:block">
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
                        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pt-3 backdrop-blur supports-backdrop-filter:bg-background/80">
                            <div
                                className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0))] sm:gap-4 sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom,0))]"
                            >
                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="signature_code"
                                        className="flex items-center gap-1.5 text-sm font-medium"
                                    >
                                        <ShieldCheckIcon className="size-4 shrink-0 text-muted-foreground" />
                                        رمز التوقيع (أُرسل إلى بريدك الإلكتروني)
                                    </Label>
                                    <Input
                                        id="signature_code"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={form.data.signature_code}
                                        onChange={(e) =>
                                            form.setData(
                                                'signature_code',
                                                e.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!form.errors.signature_code ||
                                            undefined
                                        }
                                        className="w-full max-w-full text-center tracking-[0.4em] font-mono sm:max-w-56"
                                    />
                                    {form.errors.signature_code ? (
                                        <p className="text-sm text-destructive">
                                            {form.errors.signature_code}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 flex-col gap-2">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="agreed"
                                                checked={form.data.agreed}
                                                onCheckedChange={(c) =>
                                                    form.setData(
                                                        'agreed',
                                                        c === true,
                                                    )
                                                }
                                                aria-invalid={
                                                    !!form.errors.agreed ||
                                                    undefined
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
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full shrink-0 sm:w-auto"
                                        disabled={
                                            !form.data.agreed ||
                                            !form.data.signature_code ||
                                            form.processing
                                        }
                                        onClick={() =>
                                            form.post(
                                                accept.url(
                                                    contract.contract_token,
                                                ),
                                            )
                                        }
                                    >
                                        <PenLineIcon data-icon="inline-start" />
                                        قبول وتوقيع العقد
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : null}
            </main>
        </div>
    );
}
