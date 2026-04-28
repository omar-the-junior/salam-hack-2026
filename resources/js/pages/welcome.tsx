import { Head, Link, usePage } from '@inertiajs/react';
import { CirclePlay, Clock3, Menu, ShieldCheck, Sparkles, Wallet, Waves } from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { dashboard, login, register } from '@/routes';

const navItems = [
    { href: '#features', label: 'المميزات' },
    { href: '#pricing', label: 'الأسعار' },
    { href: '#customers', label: 'العملاء' },
    { href: '#blog', label: 'المدونة' },
] as const;

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <Head title="مُسْتَحَقّ - رتّب دخلك ومدفوعاتك بسهولة">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Kufi+Arabic:wght@600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-[#f4fbf9] text-foreground" dir="rtl">
                <nav className="sticky top-0 z-50 border-b border-teal-100/70 bg-[#f4fbf9]/90 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
                        <Link href="/" className="inline-flex items-center">
                            <AppLogo className="h-8" />
                        </Link>

                        <div className="hidden items-center gap-8 md:flex">
                            {navItems.map((item, idx) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className={
                                        idx === 0
                                            ? 'border-b-2 border-primary pb-1 text-sm font-semibold text-primary'
                                            : 'text-sm font-medium text-slate-600 hover:text-primary'
                                    }
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild size="sm" className="rounded-lg">
                                    <Link href={dashboard()}>لوحة التحكم</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="hidden text-sm md:inline-flex"
                                    >
                                        <Link href={login()}>تسجيل الدخول</Link>
                                    </Button>
                                    <Button asChild size="sm" className="hidden rounded-lg md:inline-flex">
                                        <Link href={canRegister ? register() : login()}>
                                            ابدأ مجاناً
                                        </Link>
                                    </Button>

                                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                                        <SheetTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="md:hidden"
                                                aria-label="القائمة"
                                            >
                                                <Menu />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="right" className="w-72">
                                            <SheetTitle className="sr-only">القائمة</SheetTitle>
                                            <SheetHeader className="border-b pb-4">
                                                <div className="flex justify-end">
                                                    <AppLogo className="h-7" />
                                                </div>
                                            </SheetHeader>
                                            <div className="mt-4 flex flex-col gap-3">
                                                {navItems.map((item) => (
                                                    <a
                                                        key={item.label}
                                                        href={item.href}
                                                        onClick={() => setMobileOpen(false)}
                                                        className="rounded-lg px-3 py-2 text-right text-sm text-slate-600 hover:bg-muted"
                                                    >
                                                        {item.label}
                                                    </a>
                                                ))}
                                                <Button asChild variant="outline">
                                                    <Link
                                                        href={login()}
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        تسجيل الدخول
                                                    </Link>
                                                </Button>
                                                <Button asChild>
                                                    <Link
                                                        href={canRegister ? register() : login()}
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        ابدأ مجاناً
                                                    </Link>
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
                    <section className="grid items-center gap-12 lg:grid-cols-12">
                        <div className="space-y-6 lg:col-span-5">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-sm font-semibold text-teal-700 shadow-sm ring-1 ring-teal-100">
                                <Sparkles className="size-4" />
                                إدارة مالية أبسط لشغلك اليومي
                            </div>
                            <h1 className="font-display text-4xl leading-tight text-[#102a43] md:text-6xl">
                                رتّب مستحقاتك
                                <br />
                                <span className="text-teal-700">واطمئن على دخلك.</span>
                            </h1>
                            <p className="max-w-xl text-base leading-8 text-slate-600 md:text-lg">
                                كل ما تحتاجه لمتابعة روابط الدفع، العقود، المصاريف،
                                والاشتراكات في مكان واحد، بدون جداول مشتتة أو متابعة يدوية
                                كل يوم.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button asChild size="lg" className="h-11 rounded-xl px-8">
                                    <Link
                                        href={
                                            auth.user
                                                ? dashboard()
                                                : canRegister
                                                    ? register()
                                                    : login()
                                        }
                                    >
                                        جرّبه مجاناً
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="secondary"
                                    size="lg"
                                    className="h-11 rounded-xl border border-white/80 bg-white/70 px-8 text-slate-700"
                                >
                                    <Link href={auth.user ? dashboard() : login()} className="inline-flex items-center gap-2">
                                        شاهد كيف يعمل
                                        <CirclePlay className="size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="rounded-3xl border border-teal-100/80 bg-white/70 p-4 shadow-[0_20px_60px_rgba(16,42,67,0.10)] backdrop-blur md:p-6">
                                <img
                                    src="/images/dashboard-current-preview.png"
                                    alt="معاينة لوحة تحكم مُستحق"
                                    className="h-auto w-full rounded-2xl border border-teal-100 object-cover"
                                />
                            </div>
                        </div>
                    </section>

                    <section id="features" className="mt-20">
                        <div className="mb-10 text-center">
                            <h2 className="font-display text-3xl text-[#102a43] md:text-4xl">
                                كل شيء واضح من أول نظرة
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                                مُستحق يساعدك تعرف أين وصلت فلوسك، وما الذي عليك تحصيله،
                                وما الذي يخرج من حسابك شهرياً.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm md:col-span-2">
                                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <h3 className="mb-2 font-display text-xl text-[#102a43]">
                                    متابعة أوضح للمستحقات
                                </h3>
                                <p className="text-sm leading-7 text-slate-600">
                                    تابع روابط الدفع والعقود والمبالغ المتأخرة من شاشة واحدة،
                                    وخذ قرارك بناءً على أرقام واضحة بدل التخمين.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm">
                                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <Clock3 className="size-5" />
                                </div>
                                <h3 className="mb-2 font-display text-xl text-[#102a43]">
                                    وقت أقل في المتابعة
                                </h3>
                                <p className="text-sm leading-7 text-slate-600">
                                    قلّل الرسائل والتذكيرات اليدوية، وخلّ مُستحق ينبهك لما
                                    يحتاج انتباهك في الوقت المناسب.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm">
                                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                    <Waves className="size-5" />
                                </div>
                                <h3 className="mb-2 font-display text-xl text-[#102a43]">
                                    مستندات تليق بشغلك
                                </h3>
                                <p className="text-sm leading-7 text-slate-600">
                                    أنشئ روابط دفع وإيصالات وصفحات عقد مرتبة وواضحة، تعطي
                                    عملاءك انطباعاً جاداً بدون تعقيد.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal-100 bg-linear-to-l from-teal-50/90 to-white/80 p-6 shadow-sm md:col-span-2">
                                <div className="flex flex-col items-center gap-4 md:flex-row">
                                    <div className="flex-1">
                                        <h3 className="mb-2 font-display text-xl text-[#102a43]">
                                            اشتراكاتك تحت السيطرة
                                        </h3>
                                        <p className="text-sm leading-7 text-slate-600">
                                            راجع المصاريف المتكررة والاشتراكات التي قد تنساها،
                                            واعرف ما يستحق البقاء وما الأفضل إيقافه.
                                        </p>
                                    </div>
                                    <div className="inline-flex size-14 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                                        <Wallet className="size-7" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-teal-100/80 bg-slate-50 px-4 py-10 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
                        <AppLogo className="h-8" />
                        <div className="flex flex-wrap justify-center gap-5 text-xs text-slate-500">
                            <a href="#" className="hover:text-primary">
                                الشروط والأحكام
                            </a>
                            <a href="#" className="hover:text-primary">
                                سياسة الخصوصية
                            </a>
                            <a href="#" className="hover:text-primary">
                                تواصل معنا
                            </a>
                            <a href="#" className="hover:text-primary">
                                الأسئلة الشائعة
                            </a>
                        </div>
                        <div className="text-xs text-slate-500">© ٢٠٢٦ مُسْتَحَقّ</div>
                    </div>
                </footer>
            </div>
        </>
    );
}
