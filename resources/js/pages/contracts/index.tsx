import { Head, Link } from '@inertiajs/react';
import { BadgeDollarSignIcon, Clock3Icon, CopyIcon, EyeIcon, FileCheck2Icon, FileTextIcon } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClipboard } from '@/hooks/use-clipboard';
import { create, index, review, show } from '@/routes/contracts';

type ContractRow = {
    id: string;
    contract_token: string;
    project_name: string;
    client_name: string;
    total_value: string;
    currency: string;
    status: string;
    milestones_count: number;
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

export default function ContractsIndex({
    contracts,
}: {
    contracts: ContractRow[];
}) {
    const [, copy] = useClipboard();
    const activeContracts = contracts.filter((contract) => contract.status === 'active').length;
    const pendingSignature = contracts.filter((contract) => contract.status === 'draft').length;
    const activeValue = contracts
        .filter((contract) => contract.status === 'active')
        .reduce((sum, contract) => sum + Number.parseFloat(contract.total_value || '0'), 0);

    const clientReviewHref = useCallback((token: string) => {
        return `${window.location.origin}${review.url(token)}`;
    }, []);

    const handleCopyLink = useCallback(
        async (token: string) => {
            const url = clientReviewHref(token);
            const ok = await copy(url);
            if (ok) {
                toast.success('تم نسخ الرابط');
            } else {
                toast.error('تعذر نسخ الرابط. انسخ النص يدوياً إن لزم.');
            }
        },
        [clientReviewHref, copy],
    );

    return (
        <>
            <Head title="العقود" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-muted/20 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                            <FileTextIcon aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold tracking-tight">العقود</h1>
                            <p className="text-muted-foreground text-sm leading-6">
                                قائمة العقود وروابط المراجعة للعميل.
                            </p>
                        </div>
                    </div>
                    <Button type="button" asChild className="h-10 px-5 shadow-sm">
                        <Link href={create()}>
                            <FileTextIcon data-icon="inline-start" />
                            عقد جديد
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
                                <FileCheck2Icon aria-hidden />
                            </div>
                            <CardDescription>إجمالي العقود النشطة</CardDescription>
                            <CardTitle>{activeContracts}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
                                <BadgeDollarSignIcon aria-hidden />
                            </div>
                            <CardDescription>قيمة العقود النشطة</CardDescription>
                            <CardTitle>{formatMoney(activeValue, 'EGP')}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
                                <Clock3Icon aria-hidden />
                            </div>
                            <CardDescription>قيد الانتظار</CardDescription>
                            <CardTitle>{pendingSignature}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card className="min-h-[40vh] flex-1 overflow-hidden shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="secondary" size="sm" className="rounded-full">
                                الكل
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="rounded-full">
                                نشط
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="rounded-full">
                                مكتمل
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {contracts.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 py-16 text-center text-sm">
                                <FileTextIcon className="opacity-50" />
                                <span>لا توجد عقود بعد.</span>
                                <Button
                                    type="button"
                                    asChild
                                >
                                    <Link href={create()}>إنشاء عقد</Link>
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>المشروع</TableHead>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>القيمة</TableHead>
                                        <TableHead>المراحل</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead className="text-end">
                                            إجراءات
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contracts.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">
                                                {c.project_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {c.client_name}
                                            </TableCell>
                                            <TableCell>
                                                {formatMoney(
                                                    c.total_value,
                                                    c.currency,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {c.milestones_count}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={statusVariant(
                                                        c.status,
                                                    )}
                                                >
                                                    {c.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <Button variant="outline" size="icon" asChild>
                                                        <Link
                                                            href={show({
                                                                contract: c,
                                                            })}
                                                            prefetch
                                                            aria-label="عرض التفاصيل"
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="icon" type="button" onClick={() => handleCopyLink(c.contract_token)} aria-label="نسخ رابط العميل">
                                                        <CopyIcon />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ContractsIndex.layout = {
    breadcrumbs: [
        {
            title: 'العقود',
            href: index(),
        },
    ],
};
