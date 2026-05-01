import { Head, router, usePage } from '@inertiajs/react';
import {
    Edit3Icon,
    Link2Icon,
    MoreHorizontal,
    PlusIcon,
    SearchIcon,
    Trash2Icon,
    UserCheck2Icon,
    UserX2Icon,
    UsersIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { destroy, index, store, update } from '@/routes/customers';

type Customer = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    notes: string | null;
    created_at: string;
    payment_links_count: number;
};

type CustomerForm = {
    name: string;
    email: string;
    phone: string;
    notes: string;
};

type FormErrors = {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
};

function formatDate(value: string): string {
    const date = new Date(value);

    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function emptyForm(): CustomerForm {
    return {
        name: '',
        email: '',
        phone: '',
        notes: '',
    };
}

export default function CustomersIndex({ customers }: { customers: Customer[] }) {
    const page = usePage();
    const flash = (page.props as { flash?: { message?: string; type?: string } }).flash;

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [createOpen, setCreateOpen] = useState(false);
    const [createData, setCreateData] = useState<CustomerForm>(emptyForm());
    const [createErrors, setCreateErrors] = useState<FormErrors>({});
    const [creating, setCreating] = useState(false);

    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editData, setEditData] = useState<CustomerForm>(emptyForm());
    const [editErrors, setEditErrors] = useState<FormErrors>({});
    const [updating, setUpdating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!flash?.message) {
            return;
        }

        if (flash.type === 'success') {
            toast.success(flash.message);

            return;
        }

        toast.message(flash.message);
    }, [flash?.message, flash?.type]);

    const filteredCustomers = useMemo(() => {
        return customers.filter((customer) => {
            const isActive = customer.payment_links_count > 0;
            const normalizedQuery = query.trim().toLowerCase();
            const matchesQuery = !normalizedQuery
                || customer.name.toLowerCase().includes(normalizedQuery)
                || customer.email.toLowerCase().includes(normalizedQuery)
                || (customer.phone ?? '').toLowerCase().includes(normalizedQuery);

            if (!matchesQuery) {
                return false;
            }

            if (statusFilter === 'active') {
                return isActive;
            }

            if (statusFilter === 'inactive') {
                return !isActive;
            }

            return true;
        });
    }, [customers, query, statusFilter]);

    const stats = useMemo(() => {
        const active = customers.filter((customer) => customer.payment_links_count > 0).length;
        const inactive = customers.length - active;
        const totalLinks = customers.reduce((sum, customer) => sum + customer.payment_links_count, 0);

        return {
            totalCustomers: customers.length,
            activeCustomers: active,
            inactiveCustomers: inactive,
            totalLinks,
        };
    }, [customers]);

    const submitCreate = (): void => {
        setCreating(true);
        setCreateErrors({});

        router.post(store.url(), createData, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                setCreateData(emptyForm());
            },
            onError: (errors) => {
                setCreateErrors({
                    name: errors.name,
                    email: errors.email,
                    phone: errors.phone,
                    notes: errors.notes,
                });
            },
            onFinish: () => setCreating(false),
        });
    };

    const openEditDialog = (customer: Customer): void => {
        setEditingCustomer(customer);
        setEditErrors({});
        setEditData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone ?? '',
            notes: customer.notes ?? '',
        });
    };

    const submitEdit = (): void => {
        if (!editingCustomer) {
            return;
        }

        setUpdating(true);
        setEditErrors({});

        router.patch(update.url({ customer: editingCustomer.id }), editData, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCustomer(null);
            },
            onError: (errors) => {
                setEditErrors({
                    name: errors.name,
                    email: errors.email,
                    phone: errors.phone,
                    notes: errors.notes,
                });
            },
            onFinish: () => setUpdating(false),
        });
    };

    const submitDelete = (): void => {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url({ customer: deleteTarget.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
            },
            onFinish: () => setDeleting(false),
        });
    };

    const handleStatusFilterChange = useCallback((value: string) => {
        if (value !== 'all' && value !== 'active' && value !== 'inactive') {
            return;
        }

        setStatusFilter(value);
    }, []);

    const resetFilters = useCallback(() => {
        setQuery('');
        setStatusFilter('all');
    }, []);

    return (
        <>
            <Head title="العملاء" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-xl bg-muted/20 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                            <UsersIcon aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold tracking-tight">العملاء</h1>
                            <p className="text-muted-foreground text-sm leading-6">
                                إدارة وتتبع جميع عملائك في مكان واحد.
                            </p>
                        </div>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" className="min-h-11 shadow-sm">
                                <PlusIcon data-icon="inline-start" />
                                إضافة عميل
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة عميل جديد</DialogTitle>
                                <DialogDescription>
                                    أدخل بيانات العميل ليصبح متاحاً في روابط الدفع والعقود.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="create-name">الاسم</Label>
                                    <Input
                                        id="create-name"
                                        value={createData.name}
                                        onChange={(event) =>
                                            setCreateData((previous) => ({
                                                ...previous,
                                                name: event.target.value,
                                            }))
                                        }
                                    />
                                    {createErrors.name ? (
                                        <p className="text-sm text-destructive">{createErrors.name}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create-email">البريد الإلكتروني</Label>
                                    <Input
                                        id="create-email"
                                        type="email"
                                        value={createData.email}
                                        onChange={(event) =>
                                            setCreateData((previous) => ({
                                                ...previous,
                                                email: event.target.value,
                                            }))
                                        }
                                    />
                                    {createErrors.email ? (
                                        <p className="text-sm text-destructive">{createErrors.email}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create-phone">رقم الهاتف (اختياري)</Label>
                                    <Input
                                        id="create-phone"
                                        value={createData.phone}
                                        onChange={(event) =>
                                            setCreateData((previous) => ({
                                                ...previous,
                                                phone: event.target.value,
                                            }))
                                        }
                                    />
                                    {createErrors.phone ? (
                                        <p className="text-sm text-destructive">{createErrors.phone}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create-notes">ملاحظات (اختياري)</Label>
                                    <Textarea
                                        id="create-notes"
                                        value={createData.notes}
                                        onChange={(event) =>
                                            setCreateData((previous) => ({
                                                ...previous,
                                                notes: event.target.value,
                                            }))
                                        }
                                    />
                                    {createErrors.notes ? (
                                        <p className="text-sm text-destructive">{createErrors.notes}</p>
                                    ) : null}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                    إلغاء
                                </Button>
                                <Button type="button" disabled={creating} onClick={submitCreate}>
                                    حفظ العميل
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <UsersIcon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm font-normal text-muted-foreground">
                                إجمالي العملاء
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{stats.totalCustomers}</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <UserCheck2Icon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm font-normal text-muted-foreground">
                                العملاء النشطون
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{stats.activeCustomers}</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <UserX2Icon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm font-normal text-muted-foreground">
                                العملاء غير النشطين
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{stats.inactiveCustomers}</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm sm:col-span-2 lg:col-span-1">
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <Link2Icon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm font-normal text-muted-foreground">
                                روابط الدفع المرتبطة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{stats.totalLinks}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex min-h-[40vh] flex-1 flex-col gap-0 overflow-hidden py-0 shadow-sm">
                    <CardHeader className="border-border shrink-0 border-b px-6 pb-4 pt-6">
                        <p className="text-muted-foreground mb-3 text-sm font-medium">بحث وتصفية</p>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                            <div className="relative min-w-0 flex-1">
                                <Label htmlFor="customer-search" className="sr-only">
                                    البحث عن عميل
                                </Label>
                                <SearchIcon className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="customer-search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="ابحث بالاسم أو البريد أو الهاتف…"
                                    className="min-h-11 pe-10"
                                />
                            </div>
                            <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    size="sm"
                                    value={statusFilter}
                                    onValueChange={handleStatusFilterChange}
                                    className="inline-flex w-max max-w-none"
                                    aria-label="تصفية العملاء حسب النشاط"
                                >
                                    <ToggleGroupItem
                                        value="all"
                                        className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                        aria-label={`الكل، ${stats.totalCustomers} عميل`}
                                    >
                                        الكل ({stats.totalCustomers})
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="active"
                                        className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                        aria-label={`نشط، ${stats.activeCustomers} عميل`}
                                    >
                                        نشط ({stats.activeCustomers})
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="inactive"
                                        className="min-h-11 shrink-0 px-3 sm:min-h-10"
                                        aria-label={`غير نشط، ${stats.inactiveCustomers} عميل`}
                                    >
                                        غير نشط ({stats.inactiveCustomers})
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                        {customers.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-sm">
                                <UsersIcon className="opacity-50" aria-hidden />
                                <span>لا توجد عملاء بعد.</span>
                                <Button type="button" className="min-h-11" onClick={() => setCreateOpen(true)}>
                                    <PlusIcon data-icon="inline-start" />
                                    إضافة عميل
                                </Button>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                                <p className="text-muted-foreground text-sm">
                                    لا يوجد عملاء مطابقون للبحث أو التصفية الحالية.
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-11"
                                        onClick={resetFilters}
                                    >
                                        عرض الكل
                                    </Button>
                                    {query.trim() !== '' ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="min-h-11 text-muted-foreground"
                                            onClick={() => setQuery('')}
                                        >
                                            مسح البحث
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="max-w-56 text-start font-semibold">
                                                    الاسم
                                                </TableHead>
                                                <TableHead className="max-w-48 text-start font-semibold">
                                                    البريد الإلكتروني
                                                </TableHead>
                                                <TableHead className="text-start font-semibold">
                                                    رقم الهاتف
                                                </TableHead>
                                                <TableHead className="text-start font-semibold">
                                                    تاريخ الإضافة
                                                </TableHead>
                                                <TableHead className="text-start font-semibold">
                                                    الروابط
                                                </TableHead>
                                                <TableHead className="text-start font-semibold">
                                                    الحالة
                                                </TableHead>
                                                <TableHead className="w-[5.25rem] min-w-[5.25rem] whitespace-normal px-4 text-center font-semibold">
                                                    إجراءات
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCustomers.map((customer) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell className="font-medium">
                                                        <span className="block max-w-56 truncate">
                                                            {customer.name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        <span className="block max-w-48 truncate">
                                                            {customer.email}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {customer.phone || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(customer.created_at)}
                                                    </TableCell>
                                                    <TableCell>{customer.payment_links_count}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                customer.payment_links_count > 0
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {customer.payment_links_count > 0
                                                                ? 'نشط'
                                                                : 'غير نشط'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 text-center align-middle">
                                                        <div className="flex justify-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="size-9 min-h-9 min-w-9 shrink-0"
                                                                        aria-label={`إجراءات عميل ${customer.name}`}
                                                                    >
                                                                        <MoreHorizontal />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="center">
                                                                    <DropdownMenuGroup>
                                                                        <DropdownMenuItem
                                                                            onSelect={() =>
                                                                                openEditDialog(customer)
                                                                            }
                                                                        >
                                                                            <Edit3Icon />
                                                                            تعديل
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            variant="destructive"
                                                                            onSelect={() =>
                                                                                setDeleteTarget(customer)
                                                                            }
                                                                        >
                                                                            <Trash2Icon />
                                                                            حذف
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuGroup>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex flex-col gap-3 p-4 md:hidden">
                                    {filteredCustomers.map((customer) => (
                                        <Card key={customer.id} className="gap-0 py-4 shadow-sm">
                                            <CardHeader className="gap-2 px-4 pb-2 pt-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <CardTitle className="min-w-0 flex-1 text-start text-base leading-snug">
                                                        {customer.name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant={
                                                            customer.payment_links_count > 0
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        className="shrink-0"
                                                    >
                                                        {customer.payment_links_count > 0
                                                            ? 'نشط'
                                                            : 'غير نشط'}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="break-all text-start leading-snug">
                                                    {customer.email}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-4 px-4 pb-0 pt-0">
                                                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                                    <span>{customer.phone || 'لا يوجد هاتف'}</span>
                                                    <span>{formatDate(customer.created_at)}</span>
                                                    <span>روابط الدفع: {customer.payment_links_count}</span>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="min-h-11 w-full justify-center"
                                                        onClick={() => openEditDialog(customer)}
                                                    >
                                                        <Edit3Icon data-icon="inline-start" />
                                                        تعديل
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        className="min-h-11 w-full justify-center"
                                                        onClick={() => setDeleteTarget(customer)}
                                                    >
                                                        <Trash2Icon data-icon="inline-start" />
                                                        حذف
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div className="text-muted-foreground border-border border-t px-4 py-3 text-sm">
                                    عرض {filteredCustomers.length} من أصل {customers.length} عميل
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات العميل</DialogTitle>
                        <DialogDescription>حدّث البيانات ثم احفظ التغييرات.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">الاسم</Label>
                            <Input
                                id="edit-name"
                                value={editData.name}
                                onChange={(event) =>
                                    setEditData((previous) => ({
                                        ...previous,
                                        name: event.target.value,
                                    }))
                                }
                            />
                            {editErrors.name ? <p className="text-sm text-destructive">{editErrors.name}</p> : null}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editData.email}
                                onChange={(event) =>
                                    setEditData((previous) => ({
                                        ...previous,
                                        email: event.target.value,
                                    }))
                                }
                            />
                            {editErrors.email ? <p className="text-sm text-destructive">{editErrors.email}</p> : null}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-phone">رقم الهاتف</Label>
                            <Input
                                id="edit-phone"
                                value={editData.phone}
                                onChange={(event) =>
                                    setEditData((previous) => ({
                                        ...previous,
                                        phone: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-notes">ملاحظات</Label>
                            <Textarea
                                id="edit-notes"
                                value={editData.notes}
                                onChange={(event) =>
                                    setEditData((previous) => ({
                                        ...previous,
                                        notes: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>
                            إلغاء
                        </Button>
                        <Button type="button" disabled={updating} onClick={submitEdit}>
                            حفظ التعديلات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>حذف العميل</DialogTitle>
                        <DialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. هل تريد حذف العميل{' '}
                            <span className="font-medium text-foreground">
                                {deleteTarget?.name}
                            </span>
                            ؟
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            إلغاء
                        </Button>
                        <Button type="button" variant="destructive" disabled={deleting} onClick={submitDelete}>
                            تأكيد الحذف
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [
        {
            title: 'العملاء',
            href: index(),
        },
    ],
};
