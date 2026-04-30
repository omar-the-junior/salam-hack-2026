import { Form, Head, usePage } from '@inertiajs/react';
import { Loader2, Lock, Mail } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type PageProps = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    errors?: Record<string, string>;
};

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const { errors } = usePage<PageProps>().props;
    const oauthError = errors?.oauth;

    return (
        <>
            <Head title="تسجيل الدخول" />

            {oauthError ? (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>تعذّر الدخول عبر Google</AlertTitle>
                    <AlertDescription>{oauthError}</AlertDescription>
                </Alert>
            ) : null}

            {status ? (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                    {status}
                </div>
            ) : null}

            <div className="mb-6 flex justify-center lg:hidden">
                <AppLogo className="h-9" />
            </div>

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <p className="-mt-1 text-center text-sm text-muted-foreground">
                            سجّل دخولك للوصول إلى لوحة التحكم واستكمال رحلة
                            الإعداد.
                        </p>
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
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="name@example.com"
                                        disabled={processing}
                                        className="h-11 bg-muted/30 ps-11 shadow-inner dir-ltr text-start"
                                    />
                                </div>
                                <InputError message={formErrors.email} />
                                <p className="text-xs text-muted-foreground">
                                    استخدم نفس البريد الذي أنشأت به الحساب.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="password">كلمة المرور</Label>
                                    {canResetPassword ? (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                                            tabIndex={5}
                                        >
                                            نسيت كلمة المرور؟
                                        </TextLink>
                                    ) : null}
                                </div>
                                <div className="relative">
                                    <Lock
                                        className="pointer-events-none absolute start-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="كلمة المرور"
                                        disabled={processing}
                                        className="h-11 bg-muted/30 ps-11 shadow-inner"
                                    />
                                </div>
                                <InputError message={formErrors.password} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    disabled={processing}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal text-muted-foreground"
                                >
                                    تذكرني
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-12 w-full gap-2 text-base font-medium"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <>
                                        <Loader2
                                            className="size-5 shrink-0 animate-spin"
                                            aria-hidden
                                        />
                                        جاري تسجيل الدخول...
                                    </>
                                ) : (
                                    'تسجيل الدخول'
                                )}
                            </Button>

                            <div className="relative flex items-center gap-4 py-1">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    أو
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <GoogleOAuthButton
                                disabled={processing}
                                mode="login"
                            />
                        </div>

                        {canRegister ? (
                            <p className="text-center text-sm text-muted-foreground">
                                ليس لديك حساب؟{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={6}
                                    className="font-semibold text-primary"
                                >
                                    إنشاء حساب جديد
                                </TextLink>
                            </p>
                        ) : null}
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    variant: 'split' as const,
    title: 'تسجيل الدخول',
    description: 'مرحباً بك مجدداً في مساحة عملك المهنية.',
};
