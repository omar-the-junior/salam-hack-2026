import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2Icon } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { home } from '@/routes';
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
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency,
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
        <div className="bg-background min-h-svh">
            <Head title="مراجعة العقد" />
            <header className="border-b">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
                    <Link
                        href={home()}
                        className="flex items-center gap-2 font-medium"
                        prefetch
                    >
                        <AppLogoIcon className="size-9 fill-current text-foreground" />
                        <span className="sr-only">الرئيسية</span>
                    </Link>
                </div>
            </header>

            <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
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

                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-semibold leading-snug">
                        عقد بين {freelancerName} و {contract.client_name}
                    </h1>
                    <p className="text-lg font-medium">{contract.project_name}</p>
                    {contract.description ? (
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {contract.description}
                        </p>
                    ) : null}
                    <p className="text-sm">
                        إجمالي القيمة قبل الضريبة:{' '}
                        <span className="font-medium">
                            {formatMoney(
                                contract.total_value,
                                contract.currency,
                            )}
                        </span>
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium">المراحل</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم</TableHead>
                                <TableHead>النسبة</TableHead>
                                <TableHead>قبل الضريبة</TableHead>
                                <TableHead>الاستحقاق</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contract.milestones.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-muted-foreground text-center text-sm"
                                    >
                                        لا توجد مراحل مضافة بعد.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contract.milestones.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.title}</TableCell>
                                        <TableCell>{m.percentage}%</TableCell>
                                        <TableCell>
                                            {formatMoney(
                                                m.amount,
                                                contract.currency,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {m.due_date
                                                ? formatDate(m.due_date)
                                                : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {taxRateNum > 0 ? (
                    <div className="flex flex-col gap-2 rounded-lg border p-4">
                        <h2 className="text-sm font-medium">الملخص المالي</h2>
                        <div className="flex flex-col gap-1 text-sm">
                            <p>
                                المجموع الفرعي:{' '}
                                {formatMoney(
                                    contract.total_value,
                                    contract.currency,
                                )}
                            </p>
                            <p className="text-muted-foreground">
                                الضريبة ({contract.tax_rate}%):{' '}
                                {formatMoney(
                                    contract.tax_amount,
                                    contract.currency,
                                )}
                            </p>
                            <p className="font-semibold">
                                الإجمالي:{' '}
                                {formatMoney(
                                    contract.grand_total,
                                    contract.currency,
                                )}
                            </p>
                        </div>
                    </div>
                ) : null}

                {contract.terms ? (
                    <div className="flex flex-col gap-2">
                        <h2 className="text-sm font-medium">
                            الشروط والأحكام
                        </h2>
                        <div className="bg-muted/30 rounded-lg border p-4">
                            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {contract.terms}
                            </p>
                        </div>
                    </div>
                ) : null}

                {!isSigned ? (
                    <>
                        <Separator />
                        <div className="flex flex-col gap-4">
                            <h2 className="text-sm font-semibold">
                                القبول الرقمي
                            </h2>
                            <div className="flex flex-col gap-4">
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
                                        أنا {contract.client_name}، قرأتُ الشروط
                                        أعلاه و أوافق عليها.
                                    </Label>
                                </div>
                                {form.errors.agreed ? (
                                    <p className="text-destructive text-sm">
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
                                    توقيع وقبول
                                </Button>
                            </div>
                        </div>
                    </>
                ) : null}
            </main>
        </div>
    );
}
