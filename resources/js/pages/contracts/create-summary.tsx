import { Head, Link } from '@inertiajs/react';
import { ContractWizardStepper } from '@/components/contracts/contract-wizard-stepper';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { edit, index, show as contractShowRoute } from '@/routes/contracts';
import { milestones as milestonesRoute } from '@/routes/contracts/create';

type MilestoneRow = {
    id: string;
    title: string;
    percentage: string | number;
    amount: string | number;
    due_date: string | null;
    status: string;
};

type ContractSummaryPayload = {
    id: string;
    project_name: string;
    description: string | null;
    client_name: string;
    client_email: string;
    total_value: string;
    tax_rate: string;
    tax_amount: string;
    grand_total: string;
    currency: string;
    milestones: MilestoneRow[];
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

    return new Date(value).toLocaleDateString('ar-EG');
}

export default function ContractsCreateSummary({
    contract,
}: {
    contract: ContractSummaryPayload | null;
}) {
    if (!contract) {
        return (
            <>
                <Head title="إنشاء عقد: الملخص" />
                <div className="bg-surface min-h-svh px-4 py-10">
                    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
                        <CardTitle className="text-3xl">لم يتم تحديد عقد</CardTitle>
                        <p className="text-muted-foreground">
                            يرجى البدء من الخطوة الأولى أو من مراحل الدفع.
                        </p>
                        <Button asChild>
                            <Link href={index()} prefetch>
                                إلى قائمة العقود
                            </Link>
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    const hasMilestones = contract.milestones.length > 0;

    return (
        <>
            <Head title="إنشاء عقد: ملخص وإنهاء" />
            <div className="bg-surface min-h-svh px-4 py-10">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <CardTitle className="text-2xl md:text-3xl">اكتمل إعداد العقد</CardTitle>
                        <ContractWizardStepper
                            currentStep={3}
                            contractId={contract.id}
                            disableStepTwoNavigation={hasMilestones}
                        />
                        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
                            راجع الملخص أدناه، ثم انتقل إلى صفحة العقد لمشاركة رابط المراجعة مع العميل ولنسخ الرابط من هناك.
                        </p>
                    </div>

                    <Card className="border-sand bg-papyrus shadow-sm">
                        <CardHeader className="text-right">
                            <CardTitle>بيانات المشروع والعميل</CardTitle>
                            <CardDescription>{contract.project_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1 text-sm">
                                <p className="text-muted-foreground">
                                    العميل: {contract.client_name} · {contract.client_email}
                                </p>
                                {contract.description ? (
                                    <p className="text-muted-foreground leading-relaxed">
                                        {contract.description}
                                    </p>
                                ) : null}
                            </div>
                            <Separator />
                            <div className="flex flex-col gap-2 text-sm">
                                <p>
                                    المجموع قبل الضريبة:{' '}
                                    {formatMoney(contract.total_value, contract.currency)}
                                </p>
                                {Number.parseFloat(contract.tax_rate) > 0 ? (
                                    <>
                                        <p className="text-muted-foreground">
                                            الضريبة ({contract.tax_rate}%):{' '}
                                            {formatMoney(contract.tax_amount, contract.currency)}
                                        </p>
                                        <p className="font-medium">
                                            الإجمالي:{' '}
                                            {formatMoney(contract.grand_total, contract.currency)}
                                        </p>
                                    </>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-sand bg-papyrus shadow-sm">
                        <CardHeader className="text-right">
                            <CardTitle>مراحل الدفع</CardTitle>
                            <CardDescription>قراءة فقط — يمكنك تعديلها لاحقاً من صفحة العقد عند الحاجة.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>الاسم</TableHead>
                                            <TableHead>النسبة</TableHead>
                                            <TableHead>المبلغ</TableHead>
                                            <TableHead>الاستحقاق</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!hasMilestones ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-muted-foreground text-center text-sm"
                                                >
                                                    لا توجد مراحل مسجّلة.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            contract.milestones.map((m) => (
                                                <TableRow key={m.id}>
                                                    <TableCell>{m.title}</TableCell>
                                                    <TableCell>{m.percentage}%</TableCell>
                                                    <TableCell>
                                                        {formatMoney(m.amount, contract.currency)}
                                                    </TableCell>
                                                    <TableCell>{formatDate(m.due_date)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button type="button" variant="outline" className="min-h-11" asChild>
                                <Link href={index()} prefetch>
                                    قائمة العقود
                                </Link>
                            </Button>
                            <Button type="button" variant="outline" className="min-h-11" asChild>
                                <Link
                                    href={milestonesRoute.url({
                                        query: { contract_id: contract.id },
                                    })}
                                    prefetch
                                >
                                    السابق: مراحل الدفع
                                </Link>
                            </Button>
                        </div>
                        <Button className="min-h-11" asChild>
                            <Link
                                href={contractShowRoute.url({ contract: contract.id })}
                                prefetch
                            >
                                الانتقال إلى صفحة العقد
                            </Link>
                        </Button>
                    </div>

                    <p className="text-muted-foreground text-center text-xs">
                        لتعديل البيانات الأساسية للمشروع أو العميل، ارجع إلى{' '}
                        <Link
                            href={edit.url({ contract: contract.id })}
                            className="text-primary font-medium underline-offset-4 hover:underline"
                            prefetch
                        >
                            تعديل بيانات العقد
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </>
    );
}

ContractsCreateSummary.layout = {
    breadcrumbs: [
        {
            title: 'العقود',
            href: index(),
        },
        {
            title: 'إنشاء عقد · الملخص',
            href: '/contracts/create/summary',
        },
    ],
};
