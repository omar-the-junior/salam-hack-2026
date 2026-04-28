import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { step1, step2 } from '@/routes/onboarding';
import { store as storeStep2 } from '@/routes/onboarding/step2';

const professionSuggestions = ['مطور', 'مصمم', 'مسوق', 'مستشار', 'صانع محتوى', 'أخرى'] as const;

interface Step2Props {
    name: string;
    role: string;
    country?: string;
    preferred_currency?: string;
    profession?: string;
}

export default function OnboardingStep2({
    name,
    role,
    country = '',
    preferred_currency = 'EGP',
    profession = '',
}: Step2Props) {
    const { data, setData, post, processing, errors } = useForm({
        display_name: name || '',
        country: country || '',
        preferred_currency: preferred_currency || 'EGP',
        profession: profession || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeStep2.url());
    };

    return (
        <>
            <Head title="الإعداد — الخطوة 2" />
            <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
                <div className="flex w-full max-w-3xl flex-col gap-8">
                    <div className="flex justify-center">
                        <AppLogo className="h-10" />
                    </div>
                    <Card className="mx-auto w-full max-w-2xl border-border/80 bg-card shadow-sm">
                        <CardHeader className="flex flex-col gap-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className="h-1 w-10 rounded-full bg-primary" />
                                <span className="h-1 w-10 rounded-full bg-primary" />
                                <span className="h-1 w-10 rounded-full bg-muted" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                                الخطوة 2 من 2
                            </p>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-3xl">إعداد ملفك الشخصي</CardTitle>
                                <CardDescription>
                                    أخبرنا المزيد عن عملك كـ {role === 'Freelancer' ? 'مستقل' : 'صاحب عمل'}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="display_name" className={errors.display_name ? 'text-destructive' : ''}>
                                        الاسم المعروض
                                    </Label>
                                    <Input
                                        id="display_name"
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        className="h-11"
                                        aria-invalid={!!errors.display_name}
                                    />
                                    {errors.display_name && (
                                        <p className="text-sm font-medium text-destructive">{errors.display_name}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">هذا هو الاسم الذي سيظهر لعملائك</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="country" className={errors.country ? 'text-destructive' : ''}>
                                            بلد الإقامة
                                        </Label>
                                        <Select value={data.country} onValueChange={(value) => setData('country', value)}>
                                            <SelectTrigger aria-invalid={!!errors.country} className="h-11">
                                                <SelectValue placeholder="اختر بلد الإقامة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Egypt">مصر</SelectItem>
                                                <SelectItem value="Saudi Arabia">العربية السعودية</SelectItem>
                                                <SelectItem value="United Arab Emirates">الإمارات العربية المتحدة</SelectItem>
                                                <SelectItem value="Jordan">الأردن</SelectItem>
                                                <SelectItem value="Other">أخرى</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.country && <p className="text-sm font-medium text-destructive">{errors.country}</p>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label
                                            htmlFor="preferred_currency"
                                            className={errors.preferred_currency ? 'text-destructive' : ''}
                                        >
                                            العملة المفضلة
                                        </Label>
                                        <Select
                                            value={data.preferred_currency}
                                            onValueChange={(value) => setData('preferred_currency', value)}
                                        >
                                            <SelectTrigger aria-invalid={!!errors.preferred_currency} className="h-11">
                                                <SelectValue placeholder="اختر العملة الافتراضية للفواتير" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                                                <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                                                <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                                                <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.preferred_currency && (
                                            <p className="text-sm font-medium text-destructive">{errors.preferred_currency}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="-mt-2 text-xs text-muted-foreground">
                                    هذه البيانات تُستخدم لتجهيز نماذج الدفع
                                    والعقود بشكل أسرع.
                                </p>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="profession" className={errors.profession ? 'text-destructive' : ''}>
                                        المهنة (مجال العمل)
                                    </Label>
                                    <Input
                                        id="profession"
                                        placeholder="مثلاً: مطور برمجيات، مصمم جرافيك، كاتب محتوى..."
                                        value={data.profession}
                                        onChange={(e) => setData('profession', e.target.value)}
                                        className="h-11"
                                        aria-invalid={!!errors.profession}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {professionSuggestions.map((professionOption) => (
                                            <Button
                                                key={professionOption}
                                                type="button"
                                                variant={data.profession === professionOption ? 'default' : 'outline'}
                                                className="rounded-full"
                                                onClick={() => setData('profession', professionOption)}
                                            >
                                                {professionOption}
                                            </Button>
                                        ))}
                                    </div>
                                    {errors.profession && (
                                        <p className="text-sm font-medium text-destructive">{errors.profession}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        رجوع
                                    </Button>
                                    <Button type="submit" disabled={processing} size="lg" className="min-w-32">
                                        دخول لوحة التحكم
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

OnboardingStep2.layout = {
    breadcrumbs: [
        {
            title: 'الإعداد',
            href: step1.url(),
        },
        {
            title: 'الخطوة 2',
            href: step2.url(),
        },
    ],
};
