import { Form, Head } from '@inertiajs/react';
import { Loader2, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="نسيت كلمة المرور" />

            {status ? (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                    {status}
                </div>
            ) : null}

            <Form action={email.url()} method="post">
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
                                    autoFocus
                                    placeholder="name@example.com"
                                    disabled={processing}
                                    className="h-11 bg-muted/30 ps-11 shadow-inner dir-ltr text-start"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <Button
                            className="h-12 w-full gap-2 text-base font-medium"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing ? (
                                <>
                                    <Loader2
                                        className="size-5 shrink-0 animate-spin"
                                        aria-hidden
                                    />
                                    جاري الإرسال...
                                </>
                            ) : (
                                'إرسال رابط إعادة التعيين'
                            )}
                        </Button>
                    </div>
                )}
            </Form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                <span>أو العودة إلى </span>
                <TextLink href={login()}>تسجيل الدخول</TextLink>
            </p>
        </>
    );
}

ForgotPassword.layout = {
    title: 'نسيت كلمة المرور',
    description:
        'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.',
};
