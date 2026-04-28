import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { step1 } from '@/routes/onboarding';
import { store as storeStep1 } from '@/routes/onboarding/step1';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold">كيف تستخدم مُسْتَحَقّ؟</h1>
                        <p className="text-muted-foreground">اختر الخيار الذي يصف عملك بشكل أفضل</p>
                    </div>

                    <form onSubmit={submit} className="space-y-8">
                        <div className="grid gap-4 md:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setData('role', 'Freelancer')}
                                className="text-right"
                            >
                                <Card className={cn(
                                    "h-full transition-colors hover:border-primary",
                                    data.role === 'Freelancer' && "border-primary ring-1 ring-primary"
                                )}>
                                    <CardHeader>
                                        <Briefcase className="size-8 mb-2 text-primary" />
                                        <CardTitle>مستقل (Freelancer)</CardTitle>
                                        <CardDescription>أعمل بشكل مستقل لعملائي</CardDescription>
                                    </CardHeader>
                                </Card>
                            </button>

                            <button
                                type="button"
                                onClick={() => setData('role', 'Small Business Owner')}
                                className="text-right"
                            >
                                <Card className={cn(
                                    "h-full transition-colors hover:border-primary",
                                    data.role === 'Small Business Owner' && "border-primary ring-1 ring-primary"
                                )}>
                                    <CardHeader>
                                        <Building2 className="size-8 mb-2 text-primary" />
                                        <CardTitle>صاحب عمل أو شركة (Small Business Owner)</CardTitle>
                                        <CardDescription>أدير عملي التجاري أو وكالتي</CardDescription>
                                    </CardHeader>
                                </Card>
                            </button>
                        </div>
                        {errors.role && <p className="text-sm font-medium text-destructive text-center">{errors.role}</p>}

                        <div className="flex justify-end mt-8">
                            <Button type="submit" disabled={processing || !data.role} size="lg">
                                المتابعة
                            </Button>
                        </div>
                    </form>
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
