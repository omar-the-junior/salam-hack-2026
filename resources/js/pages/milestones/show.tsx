import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { index as contractsIndex, show as contractShow } from '@/routes/contracts';

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
    return new Date(value).toLocaleDateString('ar-EG');
}

export default function MilestonesShow({
    contract,
    milestone,
}: {
    contract: ContractBrief;
    milestone: MilestoneDetail;
}) {
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
                        <Button variant="outline" size="sm" asChild>
                            <Link href={contractsIndex()} prefetch>
                                العقود
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                href={contractShow({ contract })}
                                prefetch
                            >
                                العقد
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="text-muted-foreground w-40">
                                    الحالة
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {milestone.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">
                                    النسبة
                                </TableCell>
                                <TableCell>{milestone.percentage}%</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">
                                    المبلغ
                                </TableCell>
                                <TableCell>
                                    {formatMoney(
                                        milestone.amount,
                                        contract.currency,
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">
                                    تاريخ الاستحقاق
                                </TableCell>
                                <TableCell>
                                    {formatDate(milestone.due_date)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-muted-foreground">
                                    إجمالي العقد (قبل الضريبة)
                                </TableCell>
                                <TableCell>
                                    {formatMoney(
                                        contract.total_value,
                                        contract.currency,
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
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
