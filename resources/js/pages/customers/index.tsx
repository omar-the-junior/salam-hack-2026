import { Head, router, usePage } from '@inertiajs/react';
import { Edit3Icon, Link2Icon, PlusIcon, SearchIcon, Trash2Icon, UserCheck2Icon, UserX2Icon, UsersIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Textarea } from '@/components/ui/textarea';
import { destroy, index, store, update } from '@/routes/customers';
import { toast } from 'sonner';

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

    return (
        <>
            <Head title="العملاء" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-start gap-3 text-right">
                        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <UsersIcon className="size-5" aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">العملاء</h1>
                            <p className="text-sm font-medium text-foreground/80">
                                إدارة وتتبع جميع عملائك في مكان واحد.
                            </p>
                        </div>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" className="shadow-sm">
                                <PlusIcon data-icon="inline-end" />
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

                <div className="grid gap-3 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <UsersIcon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm text-muted-foreground">إجمالي العملاء</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-foreground">{stats.totalCustomers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <UserCheck2Icon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm text-muted-foreground">العملاء النشطون</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-foreground">{stats.activeCustomers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <UserX2Icon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm text-muted-foreground">العملاء غير النشطين</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-foreground">{stats.inactiveCustomers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="bg-muted text-muted-foreground mb-2 flex size-8 items-center justify-center rounded-md">
                                <Link2Icon className="size-4" aria-hidden />
                            </div>
                            <CardTitle className="text-sm text-muted-foreground">روابط الدفع المرتبطة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-foreground">{stats.totalLinks}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/80 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground">تصفية وبحث</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                            <div className="relative">
                                <SearchIcon className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="ابحث عن عميل..."
                                    className="pe-10 text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <ToggleGroup
                                type="single"
                                value={statusFilter}
                                onValueChange={(value) => {
                                    if (value === 'all' || value === 'active' || value === 'inactive') {
                                        setStatusFilter(value);
                                    }
                                }}
                                className="justify-end rounded-md border bg-muted/20 p-1"
                            >
                                <ToggleGroupItem value="all">الكل</ToggleGroupItem>
                                <ToggleGroupItem value="active">نشط</ToggleGroupItem>
                                <ToggleGroupItem value="inactive">غير نشط</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/80 shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-muted/30">
                                    <TableHead className="text-right font-semibold text-foreground">الاسم</TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">البريد الإلكتروني</TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">رقم الهاتف</TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">تاريخ الإضافة</TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">الروابط</TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">الحالة</TableHead>
                                    <TableHead className="text-right font-semibold text-foreground">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center">
                                            <div className="flex flex-col gap-3">
                                                <p className="text-sm text-muted-foreground">
                                                    لا يوجد عملاء مطابقون حالياً.
                                                </p>
                                                <div>
                                                    <Button type="button" onClick={() => setCreateOpen(true)}>
                                                        <PlusIcon data-icon="inline-end" />
                                                        إضافة أول عميل
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-muted/20">
                                            <TableCell className="font-semibold text-foreground">{customer.name}</TableCell>
                                            <TableCell className="text-foreground/90">{customer.email}</TableCell>
                                            <TableCell className="text-foreground/90">{customer.phone || '—'}</TableCell>
                                            <TableCell className="text-foreground/90">{formatDate(customer.created_at)}</TableCell>
                                            <TableCell className="font-medium text-foreground">{customer.payment_links_count}</TableCell>
                                            <TableCell>
                                                <Badge variant={customer.payment_links_count > 0 ? 'default' : 'outline'}>
                                                    {customer.payment_links_count > 0 ? 'نشط' : 'غير نشط'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => openEditDialog(customer)}
                                                    >
                                                        <Edit3Icon data-icon="inline-end" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(customer)}
                                                    >
                                                        <Trash2Icon data-icon="inline-end" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="border-t bg-muted/20 px-4 py-3 text-sm font-medium text-foreground/80">
                            عرض {filteredCustomers.length} من أصل {customers.length} عميل
                        </div>
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
