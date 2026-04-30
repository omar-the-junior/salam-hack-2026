import { Form, Head } from '@inertiajs/react';
import { Lock, Mail, User } from 'lucide-react';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="إنشاء حساب" />
            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <p className="-mt-1 text-center text-sm text-muted-foreground">
                            أنشئ حسابك خلال دقيقة، ثم أكمل الإعداد في خطوتين.
                        </p>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">الاسم الكامل</Label>
                                <div className="relative">
                                    <User
                                        className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        name="name"
                                        placeholder="أحمد محمد"
                                        className="h-11 bg-transparent ps-11 shadow-inner"
                                    />
                                </div>
                                <InputError
                                    message={errors.name}
                                    className="mt-0.5"
                                />
                                <p className="text-xs text-muted-foreground">
                                    سيظهر هذا الاسم في حسابك ويمكن تغييره لاحقًا.
                                </p>
                            </div>

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
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        className="h-11 bg-transparent ps-11 shadow-inner dir-ltr text-start"
                                    />
                                </div>
                                <InputError message={errors.email} />
                                <p className="text-xs text-muted-foreground">
                                    سنستخدمه لتسجيل الدخول والتنبيهات المهمة.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password">كلمة المرور</Label>
                                <div className="relative">
                                    <Lock
                                        className="pointer-events-none absolute start-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <PasswordInput
                                        id="password"
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="••••••••"
                                        className="h-11 bg-transparent ps-11 shadow-inner dir-ltr text-start"
                                    />
                                </div>
                                <InputError message={errors.password} />
                                <p className="text-xs text-muted-foreground">
                                    يفضّل استخدام 8 أحرف أو أكثر.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password_confirmation">
                                    تأكيد كلمة المرور
                                </Label>
                                <div className="relative">
                                    <Lock
                                        className="pointer-events-none absolute start-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="••••••••"
                                        className="h-11 bg-transparent ps-11 shadow-inner dir-ltr text-start"
                                    />
                                </div>
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-12 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                إنشاء حساب
                            </Button>

                            <div className="relative flex items-center gap-4 px-1 py-0.5">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    أو
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <GoogleOAuthButton
                                disabled={processing}
                                mode="register"
                            />
                        </div>

                        <footer className="flex flex-col items-center gap-4">
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="text-sm font-medium text-primary"
                            >
                                لديك حساب بالفعل؟ تسجيل الدخول
                            </TextLink>
                            <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
                                بالتسجيل، أنت توافق على{' '}
                                <a
                                    href="#"
                                    className="underline underline-offset-2 hover:text-foreground"
                                >
                                    الشروط والأحكام
                                </a>{' '}
                                و{' '}
                                <a
                                    href="#"
                                    className="underline underline-offset-2 hover:text-foreground"
                                >
                                    سياسة الخصوصية
                                </a>
                                .
                            </p>
                        </footer>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    variant: 'split' as const,
    title: 'إنشاء حساب جديد',
    description: 'ابدأ رحلتك المالية الاحترافية مع مُستحق.',
};
