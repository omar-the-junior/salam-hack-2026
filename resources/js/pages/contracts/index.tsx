import { Form, Head, Link } from '@inertiajs/react';
import { FileTextIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import ContractController from '@/actions/App/Http/Controllers/ContractController';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import { index, review, show } from '@/routes/contracts';
import { toast } from 'sonner';

const selectInputClassName = cn(
    'border-input text-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'disabled:cursor-not-allowed disabled:opacity-50',
);

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
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency,
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
    const [createOpen, setCreateOpen] = useState(false);
    const [createFormKey, setCreateFormKey] = useState(0);

    const openCreateContractDialog = useCallback(() => {
        setCreateOpen(true);
    }, []);

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
            <Dialog
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (open) {
                        setCreateFormKey((k) => k + 1);
                    }
                }}
            >
                <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>عقد جديد</DialogTitle>
                        <DialogDescription>
                            أدخل بيانات المشروع والعميل. ستضيف المراحل من صفحة تفاصيل العقد.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        key={createFormKey}
                        {...ContractController.store.form()}
                        options={{ preserveScroll: true }}
                        className="flex flex-col gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="project_name">اسم المشروع</Label>
                                    <Input
                                        id="project_name"
                                        name="project_name"
                                        required
                                    />
                                    <InputError message={errors.project_name} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description">
                                        وصف المشروع (اختياري)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="client_name">اسم العميل</Label>
                                    <Input
                                        id="client_name"
                                        name="client_name"
                                        required
                                    />
                                    <InputError message={errors.client_name} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="client_email">
                                        البريد الإلكتروني للعميل
                                    </Label>
                                    <Input
                                        id="client_email"
                                        name="client_email"
                                        type="email"
                                        required
                                    />
                                    <InputError message={errors.client_email} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="total_value">
                                        القيمة الإجمالية قبل الضريبة
                                    </Label>
                                    <Input
                                        id="total_value"
                                        name="total_value"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        required
                                    />
                                    <InputError message={errors.total_value} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="tax_rate">
                                        نسبة الضريبة % (اختياري)
                                    </Label>
                                    <Input
                                        id="tax_rate"
                                        name="tax_rate"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.01}
                                    />
                                    <InputError message={errors.tax_rate} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="currency">العملة</Label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        defaultValue="EGP"
                                        required
                                        className={selectInputClassName}
                                    >
                                        <option value="EGP">جنيـه مصري (EGP)</option>
                                        <option value="USD">دولار (USD)</option>
                                    </select>
                                    <InputError message={errors.currency} />
                                </div>
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="start_date">
                                            تاريخ البدء (اختياري)
                                        </Label>
                                        <Input
                                            id="start_date"
                                            name="start_date"
                                            type="date"
                                        />
                                        <InputError message={errors.start_date} />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="end_date">
                                            تاريخ الانتهاء (اختياري)
                                        </Label>
                                        <Input
                                            id="end_date"
                                            name="end_date"
                                            type="date"
                                        />
                                        <InputError message={errors.end_date} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="terms">الشروط (اختياري)</Label>
                                    <Textarea id="terms" name="terms" rows={4} />
                                    <InputError message={errors.terms} />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCreateOpen(false)}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        إنشاء العقد
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-lg font-semibold">العقود</h1>
                        <p className="text-muted-foreground text-sm">
                            قائمة العقود وروابط المراجعة للعميل.
                        </p>
                    </div>
                    <Button type="button" onClick={openCreateContractDialog}>
                        عقد جديد
                    </Button>
                </div>

                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <div className="p-4">
                        {contracts.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 py-16 text-center text-sm">
                                <FileTextIcon className="size-10 opacity-50" />
                                <span>لا توجد عقود بعد.</span>
                                <Button
                                    type="button"
                                    onClick={openCreateContractDialog}
                                >
                                    إنشاء عقد
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
                                            <TableCell>
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={show({
                                                                contract: c,
                                                            })}
                                                            prefetch
                                                        >
                                                            تفاصيل
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopyLink(
                                                                c.contract_token,
                                                            )
                                                        }
                                                    >
                                                        نسخ رابط العميل
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
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
