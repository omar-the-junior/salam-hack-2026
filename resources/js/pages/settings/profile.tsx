import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const displayNameValue = String(
        auth.user.display_name ?? auth.user.name ?? '',
    );
    const professionValue = String(auth.user.profession ?? '');
    const countryValue = String(auth.user.country ?? '');
    const preferredCurrencyValue = String(auth.user.preferred_currency ?? 'EGP');
    const defaultTaxRateValue = String(auth.user.default_tax_rate ?? '0');

    return (
        <>
            <Head title="إعدادات الملف الشخصي" />

            <h1 className="sr-only">إعدادات الملف الشخصي</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="معلومات الملف الشخصي"
                    description="تحديث بيانات الملف والإعدادات الافتراضية للفوترة"
                />

                <Form
                    {...ProfileController.update()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">الاسم</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="الاسم الكامل"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="البريد الإلكتروني"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="display_name">
                                        الاسم المعروض
                                    </Label>
                                    <Input
                                        id="display_name"
                                        className="mt-1 block w-full"
                                        defaultValue={displayNameValue}
                                        name="display_name"
                                        placeholder="الاسم الذي يظهر للعملاء"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        يظهر هذا الاسم في روابط الدفع والعقود
                                        التي يراها العميل.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="profession">المهنة</Label>
                                    <Input
                                        id="profession"
                                        className="mt-1 block w-full"
                                        defaultValue={professionValue}
                                        name="profession"
                                        placeholder="مثال: مطور، مصمم، مستشار"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        يساعدنا هذا الحقل على تحسين تجربة
                                        الإعداد مستقبلاً.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-2 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="country">بلد الإقامة</Label>
                                    <Input
                                        id="country"
                                        className="mt-1 block w-full"
                                        defaultValue={countryValue}
                                        name="country"
                                        placeholder="مصر"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="preferred_currency">
                                        العملة المفضلة
                                    </Label>
                                    <select
                                        id="preferred_currency"
                                        className="mt-1 block h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                        defaultValue={preferredCurrencyValue}
                                        name="preferred_currency"
                                    >
                                        <option value="EGP">
                                            جنيه مصري (EGP)
                                        </option>
                                        <option value="USD">دولار (USD)</option>
                                        <option value="SAR">
                                            ريال سعودي (SAR)
                                        </option>
                                        <option value="AED">
                                            درهم إماراتي (AED)
                                        </option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="default_tax_rate">
                                        نسبة الضريبة الافتراضية %
                                    </Label>
                                    <Input
                                        id="default_tax_rate"
                                        className="mt-1 block w-full dir-ltr text-start"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.01}
                                        defaultValue={defaultTaxRateValue}
                                        name="default_tax_rate"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            بريدك الإلكتروني غير مُؤكد.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                انقر هنا لإعادة إرسال بريد
                                                التحقق.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    تم إرسال رابط تحقق جديد إلى
                                                    بريدك الإلكتروني.
                                                </div>
                                            )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    حفظ
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'إعدادات الملف الشخصي',
            href: edit(),
        },
    ],
};
