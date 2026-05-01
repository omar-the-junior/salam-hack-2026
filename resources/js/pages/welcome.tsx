import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bot,
    Check,
    ChevronDown,
    CirclePlay,
    Clock3,
    CreditCard,
    FileText,
    Mail,
    Menu,
    ScanSearch,
    Send,
    ShieldCheck,
    Sparkles,
    Wallet,
    Waves,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

                    {/* Social Proof */}
                    <section className="mt-20">
                        <div className="rounded-2xl border border-teal-100/80 bg-white/60 px-6 py-8 text-center">
                            <p className="mb-4 text-sm font-medium text-slate-500">يثق بنا مستقلون وأصحاب أعمال في المنطقة</p>
                            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
                                <span className="text-lg font-bold text-slate-300">🇪🇬 مصر</span>
                                <span className="text-lg font-bold text-slate-300">🇸🇦 السعودية</span>
                                <span className="text-lg font-bold text-slate-300">🇦🇪 الإمارات</span>
                                <span className="text-lg font-bold text-slate-300">🇯🇴 الأردن</span>
                            </div>
                            <p className="mt-4 text-xs text-slate-400">أكثر من ٢٬٠٠٠ مستقل يديرون مستحقاتهم عبر مُستحق</p>
                        </div>
                    </section>

                    {/* AI Features (Pro) */}
                    <section className="mt-20">
                        <div className="mb-10 text-center">
                            <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100">مميزات احترافية</Badge>
                            <h2 className="font-display text-3xl text-[#102a43] md:text-4xl">
                                ذكاء اصطناعي يشتغل عنك
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                                خصّص حسابك للاحترافي وافتح ثلاث أدوات ذكية توفر عليك ساعات كل شهر.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm">
                                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Mail className="size-5" />
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                    <h3 className="font-display text-xl text-[#102a43]">فحص الاشتراكات بالبريد</h3>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">Pro</Badge>
                                </div>
                                <p className="text-sm leading-7 text-slate-600">
                                    اربط Gmail وخلّ الذكاء الاصطناعي يكتشف اشتراكاتك المدفوعة من الفواتير
                                    تلقائياً — بدون إدخال يدوي.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm">
                                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                    <ScanSearch className="size-5" />
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                    <h3 className="font-display text-xl text-[#102a43]">مساعد إلغاء الاشتراكات</h3>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">Pro</Badge>
                                </div>
                                <p className="text-sm leading-7 text-slate-600">
                                    اكتب اسم الخدمة والذكاء الاصطناعي يرجع لك برابط الإلغاء وخطوات
                                    مفصّلة — خلّصها في دقيقة.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm">
                                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                    <Bot className="size-5" />
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                    <h3 className="font-display text-xl text-[#102a43]">مساعدك الذكي</h3>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">Pro</Badge>
                                </div>
                                <p className="text-sm leading-7 text-slate-600">
                                    مساعد ذكي يفهم حالتك المالية وينصحك: أي اشتراكات توقف، وكيف
                                    تحسّن تدفقك النقدي.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section className="mt-20">
                        <div className="mb-10 text-center">
                            <h2 className="font-display text-3xl text-[#102a43] md:text-4xl">
                                ثلاث خطوات وخلصت
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                                من أول رابط دفع لحد ما تتابع دخلك — كل شيء في مكان واحد.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="relative rounded-2xl border border-teal-100 bg-white/75 p-6 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">
                                    ١
                                </div>
                                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <FileText className="size-5" />
                                </div>
                                <h3 className="mb-2 font-display text-xl text-[#102a43]">أنشئ رابط دفع أو عقد</h3>
                                <p className="text-sm leading-7 text-slate-600">
                                    حطّ المبلغ والعميل وخلّ مُستحق يولّد لك رابط دفع أو عقد
                                    بمراحل في ثواني.
                                </p>
                            </div>

                            <div className="relative rounded-2xl border border-teal-100 bg-white/75 p-6 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">
                                    ٢
                                </div>
                                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <Send className="size-5" />
                                </div>
                                <h3 className="mb-2 font-display text-xl text-[#102a43]">شاركه مع عميلك</h3>
                                <p className="text-sm leading-7 text-slate-600">
                                    ارسل الرابط عبر واتساب أو البريد — العميل يدفع بأي طريقة
                                    تناسبه: كارت، فوري، أو محفظة.
                                </p>
                            </div>

                            <div className="relative rounded-2xl border border-teal-100 bg-white/75 p-6 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">
                                    ٣
                                </div>
                                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <CreditCard className="size-5" />
                                </div>
                                <h3 className="mb-2 font-display text-xl text-[#102a43]">تابع دخلك ومصاريفك</h3>
                                <p className="text-sm leading-7 text-slate-600">
                                    كل دفعة تتفوت أو تتعامل تنسجّل تلقائياً — لوحة تحكم واحدة
                                    تعرف منها كل حاجة.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Pricing */}
                    <section id="pricing" className="mt-20">
                        <div className="mb-10 text-center">
                            <h2 className="font-display text-3xl text-[#102a43] md:text-4xl">
                                أسعار بسيطة بدون مفاجآت
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                                جرّب كل شيء مجاناً — ولو حبيت الذكاء الاصطناعي يساعدك، ارتقي
                                للاحترافي بـ ٥ دولار بس.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:max-w-4xl md:mx-auto">
                            {/* Free Plan */}
                            <div className="rounded-2xl border border-teal-100 bg-white/75 p-8 shadow-sm">
                                <h3 className="mb-1 font-display text-2xl text-[#102a43]">مجاني</h3>
                                <p className="mb-6 text-sm text-slate-500">كل الأساسيات لبدء تنظيم مستحقاتك</p>
                                <div className="mb-6">
                                    <span className="font-display text-5xl text-[#102a43]">$0</span>
                                    <span className="text-sm text-slate-500"> / شهرياً</span>
                                </div>
                                <ul className="mb-8 space-y-3">
                                    {[
                                        'روابط دفع غير محدودة',
                                        'عقود بمراحل دفع',
                                        'لوحة تتبع الدخل',
                                        'بطاقات المصاريف والاشتراكات',
                                        'تنبيهات التجديد',
                                        'رسوم 4% على المعاملات بين الأقران',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                                            <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild variant="outline" className="w-full rounded-xl">
                                    <Link href={auth.user ? dashboard() : canRegister ? register() : login()}>
                                        ابدأ مجاناً
                                    </Link>
                                </Button>
                            </div>

                            {/* Pro Plan */}
                            <div className="relative rounded-2xl border-2 border-teal-600 bg-white p-8 shadow-md">
                                <Badge className="absolute -top-3 right-6 bg-teal-700 text-white hover:bg-teal-700">
                                    الأكثر طلباً
                                </Badge>
                                <h3 className="mb-1 font-display text-2xl text-[#102a43]">احترافي</h3>
                                <p className="mb-6 text-sm text-slate-500">الذكاء الاصطناعي يشتغل عنك</p>
                                <div className="mb-6">
                                    <span className="font-display text-5xl text-[#102a43]">$5</span>
                                    <span className="text-sm text-slate-500"> / شهرياً</span>
                                </div>
                                <ul className="mb-8 space-y-3">
                                    {[
                                        'كل مميزات المجاني',
                                        'فحص الاشتراكات بالبريد',
                                        'مساعد إلغاء الاشتراكات',
                                        'مساعدك الذكي (AI Agent)',
                                        '0% رسوم على المعاملات',
                                        'دعم أولوية',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                                            <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild className="w-full rounded-xl bg-teal-700 hover:bg-teal-800">
                                    <Link href={auth.user ? dashboard() : canRegister ? register() : login()}>
                                        اشترك الآن
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section id="customers" className="mt-20">
                        <div className="mb-10 text-center">
                            <h2 className="font-display text-3xl text-[#102a43] md:text-4xl">
                                مستقلون يثقون في مُستحق
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                                من المصممين للمبرمجين — كلهم لقوا راحة في تنظيم مستحقاتهم.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[
                                {
                                    name: 'أحمد محمد',
                                    role: 'مطور ويب — القاهرة',
                                    quote: 'كنت أتابع مدفوعاتي في إكسل وكل مرة أنسى حاجة. من يوم ما استخدمت مُستحق، كل حاجة واضحة من أول نظرة.',
                                },
                                {
                                    name: 'نورة السيد',
                                    role: 'مصممة واجهات — الرياض',
                                    quote: 'روابط الدفع خلّت عملاء يدفعوا أسرع، والعقود بمراحل وفّرتني من مواقف محرجة مع العملاء.',
                                },
                                {
                                    name: 'خالد عمر',
                                    role: 'مستشار تسويق — دبي',
                                    quote: 'فحص البريد لقا لي 6 اشتراكات كنت ناسيها! وفرت حوالي 80 دولار في الشهر من غير ما أحس.',
                                },
                            ].map((t) => (
                                <div key={t.name} className="rounded-2xl border border-teal-100 bg-white/75 p-6 shadow-sm">
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-teal-50 text-lg font-bold text-teal-700">
                                            {t.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-display text-sm font-semibold text-[#102a43]">{t.name}</p>
                                            <p className="text-xs text-slate-500">{t.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-7 text-slate-600">"{t.quote}"</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mt-20">
                        <div className="mb-10 text-center">
                            <h2 className="font-display text-3xl text-[#102a43] md:text-4xl">
                                أسئلة شائعة
                            </h2>
                        </div>

                        <div className="mx-auto max-w-3xl space-y-3">
                            {[
                                {
                                    q: 'هل مُستحق مجاني فعلاً؟',
                                    a: 'أيوه! الخطة المجانية تتيح لك روابط الدفع، العقود، لوحة الدخل، وبطاقات المصاريف — كل ده بدون اشتراك. بس هناخد 4% رسوم على كل معاملة بين أقران.',
                                },
                                {
                                    q: 'إيه اللي أستفيد منه في الخطة الاحترافية؟',
                                    a: 'الخطة الاحترافية بـ 5 دولار في الشهر تفتح لك ثلاث أدوات ذكاء اصطناعي: فحص الاشتراكات من بريدك، مساعد إلغاء الاشتراكات، ومساعدك الذكي. كمان رسوم المعاملات بتكون 0%.',
                                },
                                {
                                    q: 'كيف أدفع لعملائي عبر مُستحق؟',
                                    a: 'أنشئ رابط دفع وشاركه مع عميلك — يدفع ببطاقة أو فوري أو محفظة موبايل. إنت مش محتاج حساب بنكي تجاري.',
                                },
                                {
                                    q: 'هل بياناتي آمنة؟',
                                    a: 'بياناتك مشفرة ومحمية. صلاحية Gmail اللي بنطلبها "قراءة فقط" وبنستخدمها بس لفحص فواتير الاشتراكات.',
                                },
                                {
                                    q: 'هل أقدر ألغي اشتراكي الاحترافي في أي وقت؟',
                                    a: 'طبعاً — ألغي في أي وقت وترجع للخطة المجانية فوراً. مفيش عقود سنوية أو رسوم خفية.',
                                },
                                {
                                    q: 'مُستحق متاح في أي دول؟',
                                    a: 'متاح في كل دول المنطقة — مصر، السعودية، الإمارات، والأردن. وبدعم عملات EGP و USD.',
                                },
                            ].map((faq, idx) => (
                                <Collapsible key={idx}>
                                    <div className="rounded-xl border border-teal-100 bg-white/75">
                                        <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 text-right text-sm font-semibold text-[#102a43] hover:text-teal-700 [&[data-state=open]>svg]:rotate-180">
                                            {faq.q}
                                            <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="px-5 pb-4 text-sm leading-7 text-slate-600">
                                            {faq.a}
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            ))}
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="mt-20">
                        <div className="relative overflow-hidden rounded-3xl bg-linear-to-l from-teal-700 to-teal-600 px-8 py-14 text-center shadow-lg">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            <div className="relative">
                                <h2 className="font-display text-3xl text-white md:text-4xl">
                                    جاهز تتحكم في مستحقاتك؟
                                </h2>
                                <p className="mx-auto mt-3 max-w-xl text-teal-100">
                                    ابدأ النهارده مجاناً — بدون بطاقة ائتمان، بدون التزام.
                                </p>
                                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                    <Button asChild size="lg" className="h-12 rounded-xl bg-white px-8 text-teal-700 hover:bg-teal-50">
                                        <Link href={auth.user ? dashboard() : canRegister ? register() : login()}>
                                            ابدأ مجاناً
                                            <ArrowLeft className="mr-2 size-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-white/40 bg-transparent px-8 text-white hover:bg-white/10">
                                        <a href="#pricing">
                                            شاهد الأسعار
                                        </a>
                                    </Button>
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
