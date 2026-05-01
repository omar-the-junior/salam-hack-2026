import { Head, Link } from '@inertiajs/react';
import {
    BadgeDollarSignIcon,
    Clock3Icon,
    CopyIcon,
    EyeIcon,
    FileCheck2Icon,
    FileTextIcon,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

type StatusFilter = 'all' | 'draft' | 'active' | 'completed';

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

function statusLabel(status: string): string {
    if (status === 'active') {
        return 'نشط';
    }

    if (status === 'draft') {
        return 'مسودة';
    }

    if (status === 'completed') {
        return 'مكتمل';
    }

    return status;
}

export default function ContractsIndex({
    contracts,
}: {
    contracts: ContractRow[];
}) {
    const [, copy] = useClipboard();
    const [filter, setFilter] = useState<StatusFilter>('all');

    const activeContracts = contracts.filter((contract) => contract.status === 'active').length;
    const pendingSignature = contracts.filter((contract) => contract.status === 'draft').length;
    const activeValue = contracts
        .filter((contract) => contract.status === 'active')
        .reduce((sum, contract) => sum + Number.parseFloat(contract.total_value || '0'), 0);

    const statusCounts = useMemo(
        () => ({
            all: contracts.length,
            draft: contracts.filter((c) => c.status === 'draft').length,
            active: contracts.filter((c) => c.status === 'active').length,
            completed: contracts.filter((c) => c.status === 'completed').length,
        }),
        [contracts],
    );

    const filteredContracts = useMemo(() => {
        if (filter === 'all') {
            return contracts;
        }

        return contracts.filter((c) => c.status === filter);
    }, [contracts, filter]);

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

    const handleFilterChange = useCallback((value: string) => {
        if (
            value !== 'all' &&
            value !== 'draft' &&
            value !== 'active' &&
            value !== 'completed'
        ) {
            return;
        }

        setFilter(value);
    }, []);

    return (
        <>
            <Head title="العقود" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl bg-muted/20 p-4 md:p-6">
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
                    <Button type="button" asChild className="h-10 min-h-11 px-5 shadow-sm">
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

                <Card className="flex min-h-[40vh] flex-1 flex-col gap-0 overflow-hidden py-0 shadow-sm">
                    <CardHeader className="border-border shrink-0 border-b px-6 pb-4 pt-6">
                        <p className="text-muted-foreground mb-3 text-sm font-medium">
                            تصفية حسب الحالة
                        </p>
                        <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                size="sm"
                                value={filter}
                                onValueChange={handleFilterChange}
                                className="inline-flex w-max max-w-none"
                                aria-label="تصفية العقود حسب الحالة"
                            >
                                <ToggleGroupItem
                                    value="all"
                                    className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                    aria-label={`الكل، ${statusCounts.all} عقد`}
                                >
                                    الكل ({statusCounts.all})
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="draft"
                                    className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                    aria-label={`مسودة، ${statusCounts.draft} عقد`}
                                >
                                    مسودة ({statusCounts.draft})
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="active"
                                    className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                    aria-label={`نشط، ${statusCounts.active} عقد`}
                                >
                                    نشط ({statusCounts.active})
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="completed"
                                    className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                    aria-label={`مكتمل، ${statusCounts.completed} عقد`}
                                >
                                    مكتمل ({statusCounts.completed})
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                        {contracts.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-sm">
                                <FileTextIcon className="opacity-50" />
                                <span>لا توجد عقود بعد.</span>
                                <Button type="button" asChild>
                                    <Link href={create()}>إنشاء عقد</Link>
                                </Button>
                            </div>
                        ) : filteredContracts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                                <p className="text-muted-foreground text-sm">
                                    لا توجد عقود بهذه الحالة.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11"
                                    onClick={() => setFilter('all')}
                                >
                                    عرض الكل
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="max-w-56">المشروع</TableHead>
                                                <TableHead className="max-w-48">العميل</TableHead>
                                                <TableHead>القيمة</TableHead>
                                                <TableHead>المراحل</TableHead>
                                                <TableHead>الحالة</TableHead>
                                                <TableHead className="text-end">
                                                    إجراءات
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredContracts.map((c) => (
                                                <TableRow key={c.id}>
                                                    <TableCell className="font-medium">
                                                        <span className="block max-w-56 truncate">
                                                            {c.project_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        <span className="block max-w-48 truncate">
                                                            {c.client_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatMoney(c.total_value, c.currency)}
                                                    </TableCell>
                                                    <TableCell>{c.milestones_count}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusVariant(c.status)}>
                                                            {statusLabel(c.status)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-11 min-h-11 min-w-11"
                                                                asChild
                                                            >
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
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                type="button"
                                                                className="size-11 min-h-11 min-w-11"
                                                                onClick={() => void handleCopyLink(c.contract_token)}
                                                                aria-label="نسخ رابط مراجعة العميل"
                                                            >
                                                                <CopyIcon />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex flex-col gap-3 p-4 md:hidden">
                                    {filteredContracts.map((c) => (
                                        <Card key={c.id} className="gap-0 py-4 shadow-sm">
                                            <CardHeader className="gap-2 px-4 pb-2 pt-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <CardTitle className="min-w-0 flex-1 text-start text-base leading-snug">
                                                        {c.project_name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant={statusVariant(c.status)}
                                                        className="shrink-0"
                                                    >
                                                        {statusLabel(c.status)}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="text-start leading-snug">
                                                    {c.client_name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-4 px-4 pb-0 pt-0">
                                                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                                    <span>
                                                        القيمة:{' '}
                                                        {formatMoney(c.total_value, c.currency)}
                                                    </span>
                                                    <span>المراحل: {c.milestones_count}</span>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="min-h-11 w-full justify-center"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={show({
                                                                contract: c,
                                                            })}
                                                            prefetch
                                                        >
                                                            <EyeIcon data-icon="inline-start" />
                                                            عرض التفاصيل
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="min-h-11 w-full justify-center"
                                                        type="button"
                                                        onClick={() => void handleCopyLink(c.contract_token)}
                                                    >
                                                        <CopyIcon data-icon="inline-start" />
                                                        نسخ رابط المراجعة
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
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
