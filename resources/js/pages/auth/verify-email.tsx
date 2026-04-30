// Components
import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="تأكيد البريد الإلكتروني" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    تم إرسال رابط تحقق جديد إلى عنوان البريد الذي قدمته عند
                    التسجيل.
                </div>
            )}

            <Form action={send.url()} method="post" className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            إعادة إرسال بريد التحقق
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            تسجيل الخروج
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'تأكيد البريد الإلكتروني',
    description:
        'يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط الذي أرسلناه إليك.',
};
