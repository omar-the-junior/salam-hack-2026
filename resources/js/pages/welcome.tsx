import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Bot,
    CalendarX,
    FileText,
    Gavel,
    Link2,
    ListChecks,
    Menu,
    MoreHorizontal,
    RefreshCw,
    Scale,
    TrendingDown,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

/** Stitch export palette — Mustahaq Finance OS desktop landing */
const surface = '#fdf8f8';
const onSurface = '#1c1b1b';
/** ~7:1 on #fdf8f8 / white (WCAG body) */
const onSurfaceVariant = '#3a3a3a';
/** Secondary line on tinted rows */
const onSurfaceSecondary = '#525252';
const surfaceContainerLow = '#f7f3f2';
const surfaceVariant = '#e5e2e1';
const surfaceContainerHighest = '#e5e2e1';
const outlineVariant = '#c4c7c7';
const onErrorContainer = '#93000a';

function IconBox({
    className,
    style,
    children,
}: {
    className?: string;
    style?: CSSProperties;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-xl',
                className,
            )}
            style={style}
        >
            {children}
        </div>
    );
}

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const copyrightYear = new Date()
        .getFullYear()
        .toLocaleString('ar-EG-u-nu-arab', { useGrouping: false });

    const navLinkInactive =
        'text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950';
    const navLinkItems = [
        { href: '#hero', label: 'الرئيسية', current: true },
        { href: '#features', label: 'المميزات', current: false },
        { href: '#', label: 'الأسعار', current: false },
        { href: '#', label: 'الأسئلة الشائعة', current: false },
    ] as const;

    const desktopNavList = (
        <ul className="flex list-none flex-wrap items-center justify-center gap-4 md:gap-6">
            {navLinkItems.map(({ href, label, current }) => (
                <li key={label}>
                    <a
                        href={href}
                        className={
                            current
                                ? 'border-b-2 border-white pb-1 font-medium text-white'
                                : navLinkInactive
                        }
                    >
                        {label}
                    </a>
                </li>
            ))}
        </ul>
    );

    return (
        <>
            <Head title="مُسْتَحَقّ - أدِر مستحقاتك، عقودك، ومدفوعاتك من مكان واحد">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div
                className="flex min-h-screen flex-col font-sans antialiased"
                dir="rtl"
                style={{ backgroundColor: surface, color: onSurface }}
            >
                {/* TopNavBar: dir=rtl + normal row = logo inline-start (right), actions inline-end (left) */}
                <header className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 text-zinc-50 shadow-sm backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 md:gap-6 md:px-12">
                        <Link
                            href="/"
                            className="shrink-0 text-2xl font-bold tracking-tight text-white"
                        >
                            مُسْتَحَقّ
                        </Link>

                        <nav
                            className="hidden min-w-0 flex-1 md:block"
                            aria-label="التنقل الرئيسي"
                        >
                            {desktopNavList}
                        </nav>

                        <div className="flex shrink-0 items-center gap-2 md:gap-3">
                            {auth.user ? (
                                <Button asChild size="sm" variant="secondary">
                                    <Link href={dashboard()}>لوحة التحكم</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="hidden text-zinc-200 hover:bg-white/10 hover:text-white md:inline-flex"
                                    >
                                        <Link href={login()}>تسجيل الدخول</Link>
                                    </Button>
                                    {canRegister ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="hidden border-0 bg-white text-zinc-900 hover:bg-zinc-100 md:inline-flex"
                                        >
                                            <Link href={register()}>ابدأ الآن</Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="hidden border-0 bg-white text-zinc-900 hover:bg-zinc-100 md:inline-flex"
                                        >
                                            <Link href={login()}>ابدأ الآن</Link>
                                        </Button>
                                    )}
                                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                                        <SheetTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-100 hover:bg-white/10 hover:text-white md:hidden"
                                                aria-label="القائمة"
                                            >
                                                <Menu className="size-6" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent
                                            side="right"
                                            className="flex w-[min(100vw-2rem,20rem)] flex-col gap-6"
                                        >
                                            <SheetHeader>
                                                <SheetTitle className="text-start">
                                                    القائمة
                                                </SheetTitle>
                                            </SheetHeader>
                                            <nav
                                                className="flex flex-col gap-4 text-start"
                                                aria-label="التنقل — جوال"
                                            >
                                                <ul className="flex list-none flex-col gap-3">
                                                    {navLinkItems.map(({ href, label, current }) => (
                                                        <li key={label}>
                                                            <a
                                                                href={href}
                                                                className={
                                                                    current
                                                                        ? 'block border-s-2 border-white ps-3 font-medium text-white'
                                                                        : `block ps-3 ${navLinkInactive}`
                                                                }
                                                                onClick={() => setMobileOpen(false)}
                                                            >
                                                                {label}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <Button asChild variant="outline">
                                                    <Link
                                                        href={login()}
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        تسجيل الدخول
                                                    </Link>
                                                </Button>
                                                {canRegister ? (
                                                    <Button asChild>
                                                        <Link
                                                            href={register()}
                                                            onClick={() => setMobileOpen(false)}
                                                        >
                                                            ابدأ الآن
                                                        </Link>
                                                    </Button>
                                                ) : null}
                                            </nav>
                                        </SheetContent>
                                    </Sheet>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 pt-16">
                    {/* Hero */}
                    <section
                        id="hero"
                        className="relative overflow-hidden pb-16 pt-24 md:pb-24 md:pt-32"
                        style={{
                            backgroundImage: `linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)`,
                            backgroundSize: '2rem 2rem',
                        }}
                    >
                        <div className="mx-auto max-w-7xl px-4 md:px-8">
                            <div className="grid items-center gap-12 md:grid-cols-2">
                                <div className="z-10 text-right">
                                    <h1 className="mb-6 text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold leading-tight tracking-tight text-[#141414]">
                                        أدِر مستحقاتك، عقودك، ومدفوعاتك من مكان واحد
                                    </h1>
                                    <p
                                        className="mb-8 ml-auto max-w-xl text-lg leading-relaxed"
                                        style={{ color: onSurfaceVariant }}
                                    >
                                        منصة متكاملة للمستقلين والشركات الصغيرة لتتبع الدخل، إدارة العقود، وأتمتة
                                        المطالبات المالية بسهولة واحترافية.
                                    </p>
                                    <div className="flex flex-row-reverse justify-start gap-4">
                                        {auth.user ? (
                                            <Button asChild size="lg" className="gap-2 px-6 shadow-sm">
                                                <Link href={dashboard()}>
                                                    <span>الذهاب للوحة التحكم</span>
                                                    <ArrowLeft className="size-4" aria-hidden />
                                                </Link>
                                            </Button>
                                        ) : canRegister ? (
                                            <Button asChild size="lg" className="gap-2 px-6 shadow-sm">
                                                <Link href={register()}>
                                                    <span>ابدأ مجاناً الآن</span>
                                                    <ArrowLeft className="size-4" aria-hidden />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button asChild size="lg" className="gap-2 px-6 shadow-sm">
                                                <Link href={login()}>
                                                    <span>تسجيل الدخول</span>
                                                    <ArrowLeft className="size-4" aria-hidden />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Dashboard preview card */}
                                <div className="relative z-10 mx-auto w-full max-w-lg md:ml-0 md:mr-auto">
                                    <div
                                        className="-rotate-2 rounded-xl border bg-white p-6 text-zinc-900 shadow-lg transition-transform duration-500 hover:rotate-0"
                                        style={{ borderColor: outlineVariant }}
                                    >
                                        <div className="mb-6 flex flex-row-reverse items-center justify-between border-b border-zinc-200 pb-4">
                                            <span className="text-base font-semibold text-zinc-900">نظرة عامة</span>
                                            <MoreHorizontal className="size-5 text-zinc-500" aria-hidden />
                                        </div>
                                        <div className="mb-6 grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200/80">
                                                <div className="mb-1 text-sm font-medium text-zinc-600">
                                                    الدخل الشهري
                                                </div>
                                                <div className="text-xl font-bold text-zinc-900">12,450 ﷼</div>
                                            </div>
                                            <div className="rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200/80">
                                                <div className="mb-1 text-sm font-medium text-zinc-600">
                                                    دفعات معلقة
                                                </div>
                                                <div className="text-xl font-bold text-red-700">3,200 ﷼</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-row-reverse items-center justify-between rounded-lg bg-zinc-100 p-3 ring-1 ring-zinc-200/80">
                                                <div className="text-xs font-medium text-zinc-600">مستحق اليوم</div>
                                                <div className="flex flex-row-reverse items-center gap-3">
                                                    <span className="text-sm font-medium text-zinc-900">
                                                        عقد تصميم شعار
                                                    </span>
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                                                        <FileText className="size-4" aria-hidden />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row-reverse items-center justify-between rounded-lg bg-zinc-100 p-3 ring-1 ring-zinc-200/80">
                                                <div className="text-xs font-medium text-zinc-600">بعد ٣ أيام</div>
                                                <div className="flex flex-row-reverse items-center gap-3">
                                                    <span className="text-sm font-medium text-zinc-900">
                                                        تجديد استضافة
                                                    </span>
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-800">
                                                        <RefreshCw className="size-4" aria-hidden />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div
                                className="absolute inset-e-[-5%] top-[-10%] h-[50%] w-[40%] rounded-full opacity-50 blur-3xl"
                                style={{ backgroundColor: surfaceVariant }}
                            />
                            <div
                                className="absolute inset-s-[-5%] bottom-[-10%] h-[40%] w-[30%] rounded-full opacity-50 blur-3xl"
                                style={{ backgroundColor: '#ddd9d8' }}
                            />
                        </div>
                    </section>

                    {/* Trust / Pain */}
                    <section
                        id="pain"
                        className="py-16 md:py-24"
                        style={{ backgroundColor: surfaceContainerLow }}
                    >
                        <div className="mx-auto max-w-7xl px-4 md:px-8">
                            <div className="mb-12 text-center">
                                <h2 className="mb-4 text-[clamp(1.875rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-[#141414]">
                                    هل ما زلت تدير أموالك بين واتساب، إكسل، والبريد؟
                                </h2>
                                <p
                                    className="mx-auto max-w-2xl text-lg leading-relaxed"
                                    style={{ color: onSurfaceVariant }}
                                >
                                    التشتت المالي يكلفك الوقت والمال. الفوضى تؤدي إلى ضياع المستحقات.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {[
                                    {
                                        Icon: AlertTriangle,
                                        title: 'عميل تأخر في الدفع',
                                        body: 'مطالبات غير منظمة وإحراج في المتابعة اليدوية.',
                                        iconClassName: 'bg-red-100 text-red-800',
                                    },
                                    {
                                        Icon: CalendarX,
                                        title: 'اشتراك شهري نسيته',
                                        body: 'مصاريف تتراكم على خدمات لا تستخدمها.',
                                        iconStyle: { backgroundColor: surfaceVariant, color: onSurface },
                                    },
                                    {
                                        Icon: TrendingDown,
                                        title: 'دخل غير واضح',
                                        body: 'صعوبة في معرفة صافي أرباحك نهاية الشهر.',
                                        iconStyle: { backgroundColor: surfaceVariant, color: onSurface },
                                    },
                                    {
                                        Icon: Gavel,
                                        title: 'عقود بدون مراحل دفع',
                                        body: 'مشاريع كبيرة بدون تنظيم مالي واضح.',
                                        iconStyle: { backgroundColor: surfaceVariant, color: onSurface },
                                    },
                                ].map((card) => (
                                    <div
                                        key={card.title}
                                        className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm"
                                    >
                                        <IconBox
                                            className={cn('mb-4', card.iconClassName)}
                                            style={card.iconStyle}
                                        >
                                            <card.Icon className="size-6" aria-hidden />
                                        </IconBox>
                                        <h3 className="mb-2 text-base font-semibold text-zinc-900">{card.title}</h3>
                                        <p className="text-sm" style={{ color: onSurfaceSecondary }}>
                                            {card.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Features — bento */}
                    <section id="features" className="py-16 md:py-24" style={{ backgroundColor: surface }}>
                        <div className="mx-auto max-w-7xl px-4 md:px-8">
                            <div className="mb-12 text-right">
                                <h2 className="mb-4 text-[clamp(1.875rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-[#141414]">
                                    كل ما تحتاجه للسيطرة على أموالك
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div
                                    className="group relative col-span-1 overflow-hidden rounded-2xl border border-border p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md md:col-span-2"
                                    style={{ backgroundColor: surfaceContainerLow }}
                                >
                                    <div className="relative z-10 w-full md:w-2/3">
                                        <IconBox className="mb-6 bg-zinc-900 text-white">
                                            <Link2 className="size-6" aria-hidden />
                                        </IconBox>
                                        <h3 className="mb-3 text-xl font-bold text-zinc-900">روابط دفع احترافية</h3>
                                        <p style={{ color: onSurfaceVariant }}>
                                            شارك روابط دفع مخصصة مع عملائك. تتبع من شاهد الرابط ومن قام بالدفع في الوقت
                                            الفعلي.
                                        </p>
                                    </div>
                                    <div className="pointer-events-none absolute inset-s-0 bottom-0 z-0 h-full w-1/2 bg-linear-to-l from-[#e5e2e1]/50 to-transparent opacity-50" />
                                    <div
                                        className="pointer-events-none absolute inset-s-4 top-1/4 z-0 flex size-32 rotate-12 items-center justify-center rounded-xl border shadow-sm"
                                        style={{
                                            backgroundColor: surfaceContainerHighest,
                                            borderColor: outlineVariant,
                                        }}
                                    >
                                        <Scale className="size-10 text-zinc-500" aria-hidden />
                                    </div>
                                </div>

                                <div
                                    className="group relative rounded-2xl border border-border p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
                                    style={{ backgroundColor: surfaceContainerLow }}
                                >
                                    <IconBox className="mb-6 bg-zinc-200 text-zinc-900">
                                        <ListChecks className="size-6" aria-hidden />
                                    </IconBox>
                                    <h3 className="mb-3 text-xl font-bold text-zinc-900">عقود بمراحل واضحة</h3>
                                    <p style={{ color: onSurfaceVariant }}>
                                        قسم مشاريعك الكبيرة إلى دفعات مجدولة (Milestones) واربطها بالتسليم.
                                    </p>
                                </div>

                                <div
                                    className="group relative rounded-2xl border border-border p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
                                    style={{ backgroundColor: surfaceContainerLow }}
                                >
                                    <IconBox className="mb-6 bg-zinc-200 text-zinc-900">
                                        <BarChart3 className="size-6" aria-hidden />
                                    </IconBox>
                                    <h3 className="mb-3 text-xl font-bold text-zinc-900">لوحة دخل شاملة</h3>
                                    <p style={{ color: onSurfaceVariant }}>
                                        تقارير بصرية واضحة لدخلك المتوقع، المحصل، والمصروفات لتتخذ قرارات أفضل.
                                    </p>
                                </div>

                                <div
                                    className="group relative col-span-1 flex flex-col-reverse items-stretch justify-between gap-8 overflow-hidden rounded-2xl border border-border p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md md:col-span-2 md:flex-row-reverse md:items-center"
                                    style={{ backgroundColor: surfaceContainerLow }}
                                >
                                    <div className="relative z-10 w-full text-right md:w-1/2">
                                        <IconBox className="mb-6 ms-auto bg-zinc-800 text-white">
                                            <Bot className="size-6" aria-hidden />
                                        </IconBox>
                                        <h3 className="mb-3 text-xl font-bold text-zinc-900">
                                            مراقبة الاشتراكات بالذكاء الاصطناعي
                                        </h3>
                                        <p style={{ color: onSurfaceVariant }}>
                                            نقوم بتحليل نفقاتك لاكتشاف الاشتراكات المتكررة وتنبيهك قبل موعد التجديد
                                            لتجنب المفاجآت.
                                        </p>
                                    </div>
                                    <div
                                        className="relative hidden h-40 w-full overflow-hidden rounded-xl border shadow-inner md:block md:w-1/3"
                                        style={{
                                            backgroundColor: surfaceContainerHighest,
                                            borderColor: outlineVariant,
                                        }}
                                    >
                                        <div className="absolute inset-e-4 inset-s-4 top-4 flex h-8 items-center rounded border border-zinc-200 bg-white px-2">
                                            <div className="h-2 w-3/4 rounded bg-zinc-300" />
                                        </div>
                                        <div className="absolute inset-e-4 inset-s-4 top-16 flex h-8 items-center rounded border border-red-200 bg-white px-2">
                                            <div
                                                className="h-2 w-1/2 rounded opacity-50"
                                                style={{ backgroundColor: onErrorContainer }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>

                <footer className="w-full border-t border-zinc-200 bg-zinc-100">
                    <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-6 px-8 py-12 md:flex-row-reverse">
                        <div className="text-xl font-black text-zinc-900">مُسْتَحَقّ</div>
                        <div className="flex flex-row-reverse flex-wrap justify-center gap-6">
                            <a
                                href="#"
                                className="text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
                            >
                                عن المنصة
                            </a>
                            <a
                                href="#"
                                className="text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
                            >
                                الشروط والأحكام
                            </a>
                            <a
                                href="#"
                                className="text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
                            >
                                سياسة الخصوصية
                            </a>
                            <a
                                href="#"
                                className="text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
                            >
                                اتصل بنا
                            </a>
                        </div>
                        <div className="text-xs text-zinc-600">
                            © {copyrightYear} مُسْتَحَقّ. جميع الحقوق محفوظة.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
