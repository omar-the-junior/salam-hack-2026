import { Head, Link } from '@inertiajs/react';
import { Link2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as contractsIndex, show as contractShow } from '@/routes/contracts';
import { show as paymentLinkShow } from '@/routes/payment-links';

type ContractBrief = {
    id: string;
    project_name: string;
    client_name: string;
    currency: string;
    total_value: string;
};

type MilestoneDetail = {
    id: string;
    title: string;
    percentage: string;
    amount: string;
    due_date: string | null;
    status: string;
};

type PaymentLinkSummary = {
    id: string;
    status: string;
    total_amount: string;
    currency: string;
    public_token: string;
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

export default function MilestonesShow({
    contract,
    milestone,
    paymentLinks,
}: {
    contract: ContractBrief;
    milestone: MilestoneDetail;
    paymentLinks: PaymentLinkSummary[];
}) {
    const createPaymentLinkHref = `/payment-links/create?milestone=${milestone.id}`;

    return (
        <>
            <Head title={milestone.title} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-lg font-semibold">{milestone.title}</h1>
                        <p className="text-muted-foreground text-sm">
                            في عقد: {contract.project_name} · {contract.client_name}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" asChild>
                            <Link href={createPaymentLinkHref} prefetch>
                                <Link2Icon data-icon="inline-start" />
                                إنشاء رابط دفع
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={contractsIndex()} prefetch>
                                العقود
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={contractShow({ contract })} prefetch>
                                العقد
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="text-muted-foreground w-40">الحالة</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{milestone.status}</Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">النسبة</TableCell>
                                <TableCell>{milestone.percentage}%</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">المبلغ</TableCell>
                                <TableCell>{formatMoney(milestone.amount, contract.currency)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">تاريخ الاستحقاق</TableCell>
                                <TableCell>{formatDate(milestone.due_date)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">إجمالي العقد (قبل الضريبة)</TableCell>
                                <TableCell>{formatMoney(contract.total_value, contract.currency)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="text-sm font-medium">روابط الدفع لهذه المرحلة</h2>
                    {paymentLinks.length === 0 ? (
                        <p className="text-muted-foreground text-sm">لا توجد روابط دفع بعد لهذه المرحلة.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الإجمالي</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>مرجع الرابط</TableHead>
                                    <TableHead className="text-end">عرض</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentLinks.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{formatMoney(row.total_amount, row.currency)}</TableCell>
                                        <TableCell>{row.status}</TableCell>
                                        <TableCell className="font-mono text-xs">{row.public_token}</TableCell>
                                        <TableCell className="text-end">
                                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                                                <Link href={paymentLinkShow(row.id)} prefetch>
                                                    التفاصيل
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </>
    );
}

MilestonesShow.layout = {
    breadcrumbs: [
        {
            title: 'العقود',
            href: contractsIndex(),
        },
    ],
};
