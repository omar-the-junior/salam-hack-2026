import { Head, useForm } from '@inertiajs/react';
import { Briefcase, Building2, CheckCircle2 } from 'lucide-react';
import type { FormEventHandler } from 'react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { step1 } from '@/routes/onboarding';
import { store as storeStep1 } from '@/routes/onboarding/step1';

export default function OnboardingStep1({ role: initialRole = '' }: { role?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        role: initialRole,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeStep1.url());
    };

    return (
        <>
            <Head title="الإعداد — الخطوة 1" />
            <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
                <div className="flex w-full max-w-3xl flex-col gap-8">
                    <div className="flex justify-center">
                        <AppLogo className="h-10" />
                    </div>
                    <Card className="mx-auto w-full max-w-2xl border-border/80 bg-card shadow-sm">
                        <CardHeader className="flex flex-col gap-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className="h-1 w-10 rounded-full bg-primary" />
                                <span className="h-1 w-10 rounded-full bg-muted" />
                                <span className="h-1 w-10 rounded-full bg-muted" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                                الخطوة 1 من 2
                            </p>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-3xl">كيف ستستخدم مُسْتَحَقّ؟</CardTitle>
                                <CardDescription>اختر الخيار الذي يصف عملك بشكل أفضل</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="flex flex-col gap-8">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('role', 'Freelancer')}
                                        className="text-right"
                                    >
                                        <Card
                                            className={cn(
                                                'relative h-full border-border/80 bg-background transition hover:border-primary/60 hover:bg-primary/5',
                                                data.role === 'Freelancer' && 'border-primary ring-2 ring-primary/20',
                                            )}
                                        >
                                            <CardHeader className="flex flex-col items-start gap-3">
                                                <div className="rounded-lg bg-muted p-3 text-primary">
                                                    <Briefcase className="size-6" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <CardTitle className="text-lg">مستقل</CardTitle>
                                                    <CardDescription>أعمل بشكل مستقل مع العملاء</CardDescription>
                                                </div>
                                            </CardHeader>
                                            {data.role === 'Freelancer' && (
                                                <CheckCircle2 className="absolute left-4 top-4 size-5 text-primary" />
                                            )}
                                        </Card>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('role', 'Small Business Owner')}
                                        className="text-right"
                                    >
                                        <Card
                                            className={cn(
                                                'relative h-full border-border/80 bg-background transition hover:border-primary/60 hover:bg-primary/5',
                                                data.role === 'Small Business Owner' &&
                                                    'border-primary ring-2 ring-primary/20',
                                            )}
                                        >
                                            <CardHeader className="flex flex-col items-start gap-3">
                                                <div className="rounded-lg bg-muted p-3 text-primary">
                                                    <Building2 className="size-6" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <CardTitle className="text-lg">صاحب عمل</CardTitle>
                                                    <CardDescription>أدير عملاً أو وكالة</CardDescription>
                                                </div>
                                            </CardHeader>
                                            {data.role === 'Small Business Owner' && (
                                                <CheckCircle2 className="absolute left-4 top-4 size-5 text-primary" />
                                            )}
                                        </Card>
                                    </button>
                                </div>
                                {errors.role && (
                                    <p className="text-center text-sm font-medium text-destructive">{errors.role}</p>
                                )}
                                <p className="-mt-3 text-center text-xs text-muted-foreground">
                                    الاختيار يساعدنا على تهيئة التجربة والمحتوى
                                    المناسبين لعملك.
                                </p>
                                <div className="flex justify-center">
                                    <Button type="submit" disabled={processing || !data.role} size="lg" className="w-full max-w-64">
                                        متابعة
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

OnboardingStep1.layout = {
    breadcrumbs: [
        {
            title: 'الإعداد',
            href: step1.url(),
        },
    ],
};
