import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const articles = [
    {
        slug: 'track-income-without-excel',
        tag: 'إدارة الدخل',
        title: '٥ طرق عملية لتتبع دخلك كمستقل بدون إكسل',
        date: '١٥ أبريل ٢٠٢٦',
        readTime: '٥ دقائق',
        content: (
            <>
                <p className="text-sm leading-8 text-slate-700">
                    لو لسه بتكتب دخلك في شيت إكسل وتنسى تحدثه كل شهر — إنت مش لوحدك. أغلب المستقلين في المنطقة
                    بيبدأوا بنفس الطريقة: شيت فيه أعمدة كتير، ألوان، ومعادلات. بس بعد شوية البيانات بتقل
                    والتحديث بيكون آخر أولوية.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">١. استخدم لوحة دخل مركزية</h3>
                <p className="text-sm leading-8 text-slate-700">
                    بدل ما تفتح إكسل كل مرة، استخدم لوحة تحكم تعرض لك دخلك الشهري في لمحة — إجمالي الدخل،
                    المبالغ المعلقة، والمتأخرة. مُستحق مثلاً يسجّل كل دفعة تلقائياً من روابط الدفع والعقود
                    بدون ما تدخل حاجة يدوياً.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">٢. صنّف دخلك حسب المصدر</h3>
                <p className="text-sm leading-8 text-slate-700">
                    مش كل الدخل واحد. الدخل من عميل مباشر غيره من منصة مثل Upwork أو Fiverr.
                    لما تصنف دخلك حسب المصدر (عملاء مباشرين، منصات، منتجات رقمية)، تقدر تعرف إيه أكتر
                    مصدر بيجيبلك فلوس وتركز عليه.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">٣. تتبع الدخل لكل عميل</h3>
                <p className="text-sm leading-8 text-slate-700">
                    اعرف كل عميل دفع كام بالظبط — الشهر ده وعلى مدار التعامل. ده بيساعدك تقرر مين
                    العملاء اللي يستاهلوا تخفض لهم ومين اللي لازم ترفع لهم الأسعار.
                    مُستحق بيعمل التحليل ده تلقائياً من بيانات روابط الدفع والعقود.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">٤. ضبط تنبيهات المبالغ المتأخرة</h3>
                <p className="text-sm leading-8 text-slate-700">
                    أكتر حاجة مزعجة كمستقل إنك تنسى تتابع المبالغ المتأخرة. بدل ما تراجع الإكسل كل أسبوع،
                    خلّ المنصة تنبهك لما مبلغ يتأخر عن موعد الدفع — رسالة أو إشعار يذكرك تتصل بالعميل.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">٥. استخدم تقدير الضرائب التلقائي</h3>
                <p className="text-sm leading-8 text-slate-700">
                    لو بتكسب أكتر من ١٥,٠٠٠ جنيه في السنة، لازم تسجل ضريبياً في مصر.
                    بدل ما تحسب يدوياً، استخدم أداة تحسب لك تقدير الضريبة تلقائياً بناءً على دخلك الفعلي
                    وتنبهك لما توصل حد التسجيل. طبعاً ده تقدير تقريبي — استشرة محاسب للتأكد.
                </p>

                <div className="mt-6 rounded-xl bg-teal-50/50 border border-teal-100 p-4">
                    <p className="text-sm leading-7 text-teal-800">
                        💡 <strong>الخلاصة:</strong> تتبع الدخل مش لازم يكون معقد. لوحة تحكم واحدة
                        تسجّل كل حاجة تلقائياً أوتّر عليك ساعات كل شهر وتخليك فاهم دخلك الحقيقي.
                        جرّب مُستحق مجاناً وشف الفرق بنفسك.
                    </p>
                </div>
            </>
        ),
    },
    {
        slug: 'forgotten-subscriptions-eating-income',
        tag: 'الاشتراكات',
        title: 'ازاي الاشتراكات المنسية تاكل من دخلك بدون ما تحس؟',
        date: '٨ أبريل ٢٠٢٦',
        readTime: '٤ دقائق',
        content: (
            <>
                <p className="text-sm leading-8 text-slate-700">
                    افتح إيميلك دلوقتي وشوف عدد رسائل "تم التجديد" أو "تم الدفع" اللي جاتك الشهر ده.
                    أغلب المستقلين بيلاقوا ٤-٦ اشتراكات مش فاكرها — أدوات جرّبوها مرة ونسوها،
                    أو خدمات لسه بيدفعوا عليها بس مش بيستخدموها.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">المشكلة: الموت البطيء المالي</h3>
                <p className="text-sm leading-8 text-slate-700">
                    اشتراك بـ ١٠ دولار في الشهر مش حاجة كبيرة — بس ٦ اشتراكات كده يعني ٧٢٠ دولار في السنة.
                    ده ممكن يمثل ١٠-١٥٪ من دخل مستقل بيكسب ٥,٠٠٠ دولار شهرياً.
                    والمشكلة إن الرقم بيزيد تدريجياً بدون ما تحس لأن كل خدمة بتجدد لوحدها.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">الاشتراكات "الزومبي"</h3>
                <p className="text-sm leading-8 text-slate-700">
                    دي الاشتراكات اللي لسه بيدفعوا عليها بس مش بيستخدموها. الأمثلة الشائعة:
                </p>
                <ul className="list-disc space-y-1 pr-5 text-sm leading-7 text-slate-700">
                    <li>أداة جرّبتها في مشروع واحد ونسيت تلغيها</li>
                    <li>خطة Pro كنت محتاجها لمرة واحدة</li>
                    <li>خدمة اشتركت فيها عشان تجربة مجانية ونسيتهة</li>
                    <li>اشتراك سنوي بيتجدد تلقائياً ومحدش فاكره</li>
                </ul>

                <h3 className="font-display text-lg text-[#102a43]">الحل: اكتشفها وأوقفها</h3>
                <p className="text-sm leading-8 text-slate-700">
                    الخطوة الأولى إنك تعرف كل اشتراكاتك في مكان واحد. مُستحق بيعمل كده بطريقتين:
                </p>
                <ul className="list-disc space-y-1 pr-5 text-sm leading-7 text-slate-700">
                    <li><strong>فحص البريد:</strong> اربط Gmail وخلّ الذكاء الاصطناعي يكتشف فواتير الاشتراكات تلقائياً</li>
                    <li><strong>الإدخال اليدوي:</strong> أضف كل اشتراك كـ "بطاقة مصاريف" بالاسم والمبلغ وتاريخ التجديد</li>
                </ul>

                <h3 className="font-display text-lg text-[#102a43]">تنبيهات التجديد = فرصة القرار</h3>
                <p className="text-sm leading-8 text-slate-700">
                    قبل ما يتجدد أي اشتراك بـ ٧ أيام، مُستحق بينبهك وبيديك خيارين:
                    "استمر" أو "ألغي". لو اخترت الإلغاء، مساعد الإلغاء بالذكاء الاصطناعي
                    بيرجع لك رابط الإلغاء وخطوات مفصّلة — خلّصها في دقيقة.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">نسبة المصاريف للدخل</h3>
                <p className="text-sm leading-8 text-slate-700">
                    المقياس المهم: اشتراكاتك تمثل كام٪ من دخلك الشهري؟
                    أقل من ١٠٪ (أخضر) — تمام. ١٠-٢٠٪ (أصفر) — راجع. أكتر من ٢٠٪ (أحمر) — لازم تتصرف.
                    مُستحق بيحسب النسبة دي تلقائياً وينصحك بأي اشتراكات توقفها.
                </p>

                <div className="mt-6 rounded-xl bg-amber-50/50 border border-amber-100 p-4">
                    <p className="text-sm leading-7 text-amber-800">
                        💡 <strong>نصيحة:</strong> راجع اشتراكاتك النهارده — كل اشتراك تلغيه وفر
                        حقيقي في جيبك. المستخدمين بتوع مُستحق وفّروا في المتوسط ٨٠ دولار في الشهر
                        من اشتراكات كانوا ناسيينها.
                    </p>
                </div>
            </>
        ),
    },
    {
        slug: 'payment-links-fastest-way-to-get-paid',
        tag: 'روابط الدفع',
        title: 'روابط الدفع: أسرع طريقة تتحصل من عملائك في المنطقة',
        date: '١ أبريل ٢٠٢٦',
        readTime: '٤ دقائق',
        content: (
            <>
                <p className="text-sm leading-8 text-slate-700">
                    كم مرة راسلت عميلك على واتساب تقوله "ابعت الفلوس على الحساب ده" — وبعدين استنيت
                    أيام عشان يحوّل؟ أو بعتله رقم حسابك وبعدين لقيت المبلغ غلط؟
                    روابط الدفع تحل المشكلة دي كلها.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">إيه هو رابط الدفع؟</h3>
                <p className="text-sm leading-8 text-slate-700">
                    رابط الدفع هو صفحة ويب فيها كل تفاصيل الدفع: المبلغ، الوصف، اسمك أو اسم شركتك،
                    وطرق الدفع المتاحة. العميل بيفتح الرابط ويدفع في ثواني — بدون ما يحتاج يسجل حساب
                    أو يحفظ رقم حسابك.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">طرق الدفع اللي العميل يقدر يستخدمها</h3>
                <p className="text-sm leading-8 text-slate-700">
                    في منطقة الشرق الأوسط، التنوع في طرق الدفع مهم جداً:
                </p>
                <ul className="list-disc space-y-1 pr-5 text-sm leading-7 text-slate-700">
                    <li><strong>بطاقات الدفع:</strong> Visa و Mastercard — لكل العملاء</li>
                    <li><strong>فوري (Fawry):</strong> للعملاء في مصر اللي بيفضلوا يدفعوا كاش</li>
                    <li><strong>محافظ رقمية:</strong> Vodafone Cash و Orange Money — شائعة في مصر</li>
                </ul>
                <p className="text-sm leading-8 text-slate-700">
                    مُستحق بيستخدم Paymob كبوابة دفع — يعني مش محتاج سجل تجاري أو حساب بنكي رسمي
                    عشان تبدأ تقبل مدفوعات.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">ازاي تنشئ رابط دفع في مُستحق</h3>
                <p className="text-sm leading-8 text-slate-700">
                    العملية بسيطة: حط المبلغ، الوصف، اسم العميل، وموعد الاستحقاق.
                    مُستحق بيولّد الرابط تلقائياً — انسخه وابعتله على واتساب أو إيميل.
                    تقدر تضيف نسبة ضريبة كمان لو محتاج (بتاعمل حسابها تلقائي).
                </p>

                <h3 className="font-display text-lg text-[#102a43]">تتبع الحالة تلقائياً</h3>
                <p className="text-sm leading-8 text-slate-700">
                    كل رابط دفع ليه حالة: معلق ← مدفوع ← متأخر.
                    لما العميل يدفع، الحالة بتتحدث تلقائياً والدفعة بتتنسجل في لوحة الدخل.
                    لو المبلغ اتأخر، مُستحق بينبهك عشان تتابع مع العميل.
                </p>

                <h3 className="font-display text-lg text-[#102a43]">روابط الدفع + العقود بمراحل</h3>
                <p className="text-sm leading-8 text-slate-700">
                    لو عندك مشروع كبير، تقدر تعمل عقد بمراحل — وكل مرحلة ليها رابط دفع خاص.
                    لما المرحلة تخلص وتكون جاهزة للدفع، رابط الدفع بينشط تلقائياً.
                    ده بيخلي عملية التحصيل منظمة وواضحة للطرفين.
                </p>

                <div className="mt-6 rounded-xl bg-teal-50/50 border border-teal-100 p-4">
                    <p className="text-sm leading-7 text-teal-800">
                        💡 <strong>الخلاصة:</strong> رابط الدفع بيخلّي العميل يدفع أسرع لأنه بيلقى
                        كل حاجة جاهزة أمامه — المبلغ، الوصف، وطرق الدفع. جرّب أنشئ رابط دفع
                        في مُستحق وشوف الفرق في سرعة التحصيل.
                    </p>
                </div>
            </>
        ),
    },
];

export default function Blog() {
    return (
        <>
            <Head title="المدوّنة — مُسْتَحَقّ">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
                        <Button asChild variant="ghost" size="sm" className="text-sm">
                            <Link href="/">
                                العودة للرئيسية
                                <ArrowLeft className="mr-1 size-4" />
                            </Link>
                        </Button>
                    </div>
                </nav>

                <main className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
                    <div className="mb-10">
                        <h1 className="font-display text-3xl text-[#102a43] md:text-4xl">من مدوّنة مُستحق</h1>
                        <p className="mt-3 text-slate-600">نصائح وأفكار تساعدك تدير شغلك المالي بذكاء</p>
                    </div>

                    <div className="space-y-12">
                        {articles.map((article) => (
                            <article key={article.slug} id={article.slug} className="scroll-mt-20">
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 text-[10px]">
                                        <Tag className="ml-1 size-3" />
                                        {article.tag}
                                    </Badge>
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                        <Calendar className="size-3" />
                                        {article.date}
                                    </span>
                                    <span className="text-xs text-slate-400">· {article.readTime} قراءة</span>
                                </div>

                                <h2 className="mb-6 font-display text-2xl text-[#102a43] md:text-3xl">
                                    {article.title}
                                </h2>

                                <div className="space-y-4">
                                    {article.content}
                                </div>

                                <div className="my-8 border-t border-teal-100" />
                            </article>
                        ))}
                    </div>
                </main>

                <footer className="border-t border-teal-100/80 bg-slate-50 px-4 py-10 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
                        <AppLogo className="h-8" />
                        <div className="flex flex-wrap justify-center gap-5 text-xs text-slate-500">
                            <Link href="/terms" className="hover:text-primary">
                                الشروط والأحكام
                            </Link>
                            <Link href="/privacy" className="hover:text-primary">
                                سياسة الخصوصية
                            </Link>
                            <a href="/#contact" className="hover:text-primary">
                                تواصل معنا
                            </a>
                            <a href="/#faq" className="hover:text-primary">
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
