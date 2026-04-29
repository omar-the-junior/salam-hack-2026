import { Form, Head, Link } from '@inertiajs/react';
import { Link2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import MilestoneController from '@/actions/App/Http/Controllers/MilestoneController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClipboard } from '@/hooks/use-clipboard';
import { index, review } from '@/routes/contracts';
import { show as milestoneShow } from '@/routes/milestones';

type MilestoneRow = {
    id: string;
    title: string;
    percentage: string;
    amount: string;
    due_date: string | null;
    status: string;
};

type ContractDetail = {
    id: string;
    contract_token: string;
    project_name: string;
    description: string | null;
    client_name: string;
    client_email: string;
    total_value: string;
    tax_rate: string;
    tax_amount: string;
    grand_total: string;
    currency: string;
    status: string;
    terms: string | null;
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

function statusVariant(
    status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
    if (status === 'active') {
        return 'default';
    }

    if (status === 'draft') {
        return 'secondary';
    }

    return 'outline';
}

export default function ContractsShow({
    contract,
}: {
    contract: ContractDetail;
}) {
    const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
    const [, copy] = useClipboard();

    const clientReviewAbsoluteUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}${review.url(contract.contract_token)}`
            : '';

    const canAddMilestone = contract.milestones.length < 5;

    return (
        <>
            <Head title={contract.project_name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-semibold">
                                {contract.project_name}
                            </h1>
                            <Badge variant={statusVariant(contract.status)}>
                                {contract.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            العميل: {contract.client_name} · {contract.client_email}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={index()} prefetch>
                                كل العقود
                            </Link>
                        </Button>
                        <Dialog
                            open={milestoneDialogOpen}
                            onOpenChange={setMilestoneDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    type="button"
                                    disabled={!canAddMilestone}
                                >
                                    إضافة مرحلة
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>مرحلة جديدة</DialogTitle>
                                    <DialogDescription>
                                        أضف مرحلة للعقد (حتى 5 مراحل).
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    {...MilestoneController.store.form(
                                        contract,
                                    )}
                                    options={{ preserveScroll: true }}
                                    onSuccess={() =>
                                        setMilestoneDialogOpen(false)
                                    }
                                    className="flex flex-col gap-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="title">
                                                    اسم المرحلة
                                                </Label>
                                                <Input
                                                    id="title"
                                                    name="title"
                                                    required
                                                />
                                                <InputError message={errors.title} />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="percentage">
                                                    النسبة %
                                                </Label>
                                                <Input
                                                    id="percentage"
                                                    name="percentage"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={0.01}
                                                    required
                                                />
                                                <InputError
                                                    message={errors.percentage}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="due_date">
                                                    تاريخ الاستحقاق (اختياري)
                                                </Label>
                                                <Input
                                                    id="due_date"
                                                    name="due_date"
                                                    type="date"
                                                />
                                                <InputError
                                                    message={errors.due_date}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    حفظ
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="text-sm font-medium">
                            مشاركة مع العميل
                        </h2>
                        <p className="text-muted-foreground break-all text-xs">
                            {clientReviewAbsoluteUrl || review.url(contract.contract_token)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                    const url = `${window.location.origin}${review.url(contract.contract_token)}`;
                                    const ok = await copy(url);

                                    if (ok) {
                                        toast.success('تم نسخ الرابط');
                                    } else {
                                        toast.error(
                                            'تعذر نسخ الرابط. انسخ النص يدوياً إن لزم.',
                                        );
                                    }
                                }}
                            >
                                نسخ الرابط
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={review.url(contract.contract_token)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    معاينة العميل
                                </a>
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="text-sm font-medium">القيمة</h2>
                        <p className="text-sm">
                            المجموع قبل الضريبة:{' '}
                            {formatMoney(contract.total_value, contract.currency)}
                        </p>
                        {Number.parseFloat(contract.tax_rate) > 0 && (
                            <>
                                <p className="text-muted-foreground text-sm">
                                    الضريبة ({contract.tax_rate}%):{' '}
                                    {formatMoney(
                                        contract.tax_amount,
                                        contract.currency,
                                    )}
                                </p>
                                <p className="font-medium">
                                    الإجمالي:{' '}
                                    {formatMoney(
                                        contract.grand_total,
                                        contract.currency,
                                    )}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {contract.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {contract.description}
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-medium">المراحل</h2>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canAddMilestone}
                            onClick={() => setMilestoneDialogOpen(true)}
                        >
                            إضافة مرحلة
                        </Button>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الاسم</TableHead>
                                    <TableHead>النسبة</TableHead>
                                    <TableHead>المبلغ</TableHead>
                                    <TableHead>الاستحقاق</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-end">رابط دفع</TableHead>
                                    <TableHead className="text-end">عرض</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contract.milestones.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-muted-foreground text-center text-sm"
                                        >
                                            لا توجد مراحل بعد. استخدم «إضافة مرحلة» لإنشاء مرحلة.
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
                                                {formatDate(m.due_date)}
                                            </TableCell>
                                            <TableCell>{m.status}</TableCell>
                                            <TableCell className="text-end">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/payment-links/create?milestone=${m.id}`} prefetch>
                                                        <Link2Icon data-icon="inline-start" />
                                                        رابط دفع
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0"
                                                    asChild
                                                >
                                                    <Link
                                                        href={milestoneShow({
                                                            milestone: m,
                                                        })}
                                                        prefetch
                                                    >
                                                        تفاصيل
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}

ContractsShow.layout = {
    breadcrumbs: [
        {
            title: 'العقود',
            href: index(),
        },
    ],
};
