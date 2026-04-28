import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { step1, step2 } from '@/routes/onboarding';
import { store as storeStep2 } from '@/routes/onboarding/step2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
            <div className="flex h-full flex-1 flex-col items-center p-4">
                <div className="w-full max-w-xl space-y-8 mt-12">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold">إعداد ملفك الشخصي</h1>
                        <p className="text-muted-foreground">أخبرنا المزيد عن عملك كـ {role === 'Freelancer' ? 'مستقل' : 'صاحب عمل'}</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="display_name" className={errors.display_name ? "text-destructive" : ""}>الاسم المعروض</Label>
                            <Input
                                id="display_name"
                                value={data.display_name}
                                onChange={(e) => setData('display_name', e.target.value)}
                                className="w-full"
                                aria-invalid={!!errors.display_name}
                            />
                            {errors.display_name && <p className="text-sm font-medium text-destructive">{errors.display_name}</p>}
                            <p className="text-sm text-muted-foreground">هذا هو الاسم الذي سيظهر لعملائك</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="profession" className={errors.profession ? "text-destructive" : ""}>المهنة (مجال العمل)</Label>
                            <Input
                                id="profession"
                                placeholder="مثلاً: مطور برمجيات، مصمم جرافيك، كاتب محتوى..."
                                value={data.profession}
                                onChange={(e) => setData('profession', e.target.value)}
                                className="w-full"
                                aria-invalid={!!errors.profession}
                            />
                            {errors.profession && <p className="text-sm font-medium text-destructive">{errors.profession}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country" className={errors.country ? "text-destructive" : ""}>بلد الإقامة</Label>
                            <Select
                                value={data.country}
                                onValueChange={(value) => setData('country', value)}
                            >
                                <SelectTrigger aria-invalid={!!errors.country}>
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

                        <div className="space-y-2">
                            <Label htmlFor="preferred_currency" className={errors.preferred_currency ? "text-destructive" : ""}>العملة المفضلة</Label>
                            <Select
                                value={data.preferred_currency}
                                onValueChange={(value) => setData('preferred_currency', value)}
                            >
                                <SelectTrigger aria-invalid={!!errors.preferred_currency}>
                                    <SelectValue placeholder="اختر العملة الافتراضية للفواتير" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                                    <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.preferred_currency && <p className="text-sm font-medium text-destructive">{errors.preferred_currency}</p>}
                        </div>

                        <div className="flex justify-between items-center mt-8">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                رجوع
                            </Button>
                            <Button type="submit" disabled={processing} size="lg">
                                البدء
                            </Button>
                        </div>
                    </form>
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
