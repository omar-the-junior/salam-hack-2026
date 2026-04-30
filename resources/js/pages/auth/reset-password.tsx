import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, Lock, LockKeyhole, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { request, update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    return (
        <>
            <Head title="إعادة تعيين كلمة المرور" />

            <div className="mb-8 text-center">
                <h2 className="text-lg font-semibold text-foreground">
                    إعادة ضبط كلمة المرور
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    قم بإنشاء كلمة مرور جديدة وقوية لحسابك.
                </p>
            </div>

            <Form
                action={update.url()}
                method="post"
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    defaultValue={email}
                                    readOnly
                                    className="h-11 cursor-not-allowed bg-muted ps-11 opacity-90 dir-ltr text-start"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password">كلمة المرور الجديدة</Label>
                            <div className="relative">
                                <Lock
                                    className="pointer-events-none absolute start-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="أدخل كلمة المرور الجديدة"
                                    className="h-11 bg-background ps-11 shadow-inner"
                                />
                            </div>
                            <InputError message={errors.password} />

                            <div className="mt-1 rounded-lg border border-border bg-muted/40 p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    يُنصح أن تحتوي كلمة المرور على:
                                </p>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="size-3.5 shrink-0 text-muted-foreground" />
                                        8 أحرف على الأقل
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="size-3.5 shrink-0 text-muted-foreground" />
                                        أحرف وأرقام (ورموز في بيئة الإنتاج)
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password_confirmation">
                                تأكيد كلمة المرور الجديدة
                            </Label>
                            <div className="relative">
                                <LockKeyhole
                                    className="pointer-events-none absolute start-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="أعد إدخال كلمة المرور"
                                    className="h-11 bg-background ps-11 shadow-inner"
                                />
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 h-12 w-full gap-2 text-base font-medium"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            تحديث كلمة المرور
                        </Button>

                        <div className="text-center">
                            <TextLink
                                href={login()}
                                className="text-sm font-medium text-muted-foreground decoration-transparent hover:text-primary hover:decoration-primary"
                            >
                                العودة إلى تسجيل الدخول
                            </TextLink>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            <TextLink
                                href={request()}
                                className="font-medium text-primary decoration-primary/40"
                            >
                                طلب رابط جديد
                            </TextLink>
                        </p>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    variant: 'narrow' as const,
    title: '',
    description: '',
};
