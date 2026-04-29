import { Head, Link } from '@inertiajs/react';
import { AlertTriangleIcon, CheckCircle2Icon, Clock3Icon, Link2Icon, PlusIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { create, index, show } from '@/routes/payment-links';

type PaymentLinkRow = {
    id: string;
    client_name: string;
    total_amount: string;
    currency: string;
    status: string;
    due_date: string | null;
    milestone?: {
        id: string;
        title: string;
        contract?: {
            id: string;
            project_name: string;
        } | null;
    } | null;
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

export default function PaymentLinksIndex({
    paymentLinks,
}: {
    paymentLinks: PaymentLinkRow[];
}) {
    const total = paymentLinks.length;
    const pending = paymentLinks.filter((link) => link.status === 'pending').length;
    const paid = paymentLinks.filter((link) => link.status === 'paid').length;
    const overdue = paymentLinks.filter((link) => link.status === 'overdue').length;

    const statusBadge = (status: string) => {
        if (status === 'paid') {
            return <Badge>مدفوعة</Badge>;
        }

        if (status === 'overdue') {
            return <Badge variant="destructive">متأخرة</Badge>;
        }

        return <Badge variant="secondary">بانتظار الدفع</Badge>;
    };

    return (
        <>
            <Head title="روابط الدفع" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <Link2Icon className="size-5" aria-hidden />
                            </span>
                            <div>
                            <CardTitle>روابط الدفع</CardTitle>
                            <CardDescription>
                                إدارة روابط الدفع التي أنشأتها ومشاركتها مع العملاء.
                            </CardDescription>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href={create()}>
                                <PlusIcon data-icon="inline-start" />
                                إنشاء رابط جديد
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>

                <div className="grid gap-3 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <Link2Icon className="size-4" aria-hidden />
                            </div>
                            <CardDescription>إجمالي الروابط</CardDescription>
                            <CardTitle>{total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <Clock3Icon className="size-4" aria-hidden />
                            </div>
                            <CardDescription>بانتظار الدفع</CardDescription>
                            <CardTitle>{pending}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <CheckCircle2Icon className="size-4" aria-hidden />
                            </div>
                            <CardDescription>مدفوعة</CardDescription>
                            <CardTitle>{paid}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <AlertTriangleIcon className="size-4" aria-hidden />
                            </div>
                            <CardDescription>متأخرة</CardDescription>
                            <CardTitle>{overdue}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <Input placeholder="البحث برقم الرابط أو اسم العميل..." className="lg:max-w-sm" />
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Select defaultValue="all">
                                    <SelectTrigger className="sm:w-44">
                                        <SelectValue placeholder="الحالة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">جميع الحالات</SelectItem>
                                            <SelectItem value="pending">بانتظار الدفع</SelectItem>
                                            <SelectItem value="paid">مدفوعة</SelectItem>
                                            <SelectItem value="overdue">متأخرة</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Select defaultValue="newest">
                                    <SelectTrigger className="sm:w-52">
                                        <SelectValue placeholder="الترتيب" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="newest">تاريخ الإنشاء (الأحدث)</SelectItem>
                                            <SelectItem value="oldest">تاريخ الإنشاء (الأقدم)</SelectItem>
                                            <SelectItem value="amount-desc">المبلغ (الأعلى)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المشروع / المرحلة</TableHead>
                                    <TableHead>العميل</TableHead>
                                    <TableHead>الإجمالي</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الاستحقاق</TableHead>
                                    <TableHead>الإجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentLinks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            لا توجد روابط دفع بعد.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paymentLinks.map((paymentLink) => (
                                        <TableRow key={paymentLink.id}>
                                            <TableCell>
                                                {paymentLink.milestone
                                                    ? `${paymentLink.milestone.contract?.project_name ?? '—'} · ${paymentLink.milestone.title}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>{paymentLink.client_name}</TableCell>
                                            <TableCell>
                                                {formatMoney(paymentLink.total_amount, paymentLink.currency)}
                                            </TableCell>
                                            <TableCell>{statusBadge(paymentLink.status)}</TableCell>
                                            <TableCell>{paymentLink.due_date ?? 'غير محدد'}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={show(paymentLink.id)}>عرض</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PaymentLinksIndex.layout = {
    breadcrumbs: [
        {
            title: 'روابط الدفع',
            href: index(),
        },
    ],
};
