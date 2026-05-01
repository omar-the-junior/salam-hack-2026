import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';

export default function Terms() {
    return (
        <>
            <Head title="الشروط والأحكام — مُسْتَحَقّ">
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
                    <h1 className="font-display text-3xl text-[#102a43] md:text-4xl">الشروط والأحكام</h1>
                    <p className="mt-2 text-sm text-slate-500">آخر تحديث: ١ مايو ٢٠٢٦</p>

                    <div className="mt-10 space-y-8 text-sm leading-8 text-slate-700">
                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١. مقدمة</h2>
                            <p>
                                مرحباً بك في مُستحق. باستخدامك للمنصة، فإنك توافق على هذه الشروط والأحكام.
                                مُستحق هي منصة إدارة مالية مصممة للمستقلين وأصحاب الأعمال الصغيرة في منطقة الشرق الأوسط وشمال أفريقيا،
                                تجمع بين روابط الدفع، العقود، تتبع الدخل، وإدارة الاشتراكات في مكان واحد.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٢. إنشاء الحساب</h2>
                            <p>
                                يجب أن يكون عمرك ١٨ سنة على الأقل لإنشاء حساب. أنت مسؤول عن صحة البيانات التي تقدمها
                                عند التسجيل، بما في ذلك اسمك وبلدك وعملتك المفضلة. يُحظر إنشاء أكثر من حساب لنفس الشخص.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٣. روابط الدفع والمعاملات</h2>
                            <p>
                                يمكنك إنشاء روابط دفع ومشاركتها مع عملائك. مُستحق يعمل مع بوابات دفع معتمدة (مثل Paymob)
                                لمعالجة المدفوعات. رسوم المعاملة على الخطة المجانية هي ٤٪ من قيمة المعاملة بين الأقران،
                                بينما الخطة الاحترافية لا تتحمل أي رسوم. الأموال تذهب مباشرة إلى حسابك البنكي أو محفظتك المرتبطة
                                — مُستحق لا يحتفظ بأموالك ولا يوفر خدمة ضمان (Escrow).
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٤. العقود والمراحل</h2>
                            <p>
                                يمكنك إنشاء عقود مشروع بمراحل دفع. التوقيع الإلكتروني في مُستحق عبارة عن قبول رقمي
                                (تحديد مربع موافقة مع تسجيل الوقت وعنوان IP) وليس توقيعاً رقمياً معتمداً قانونياً.
                                أنت مسؤول عن مراجعة العقد مع مستشار قانوني إذا لزم الأمر. مُستحق لا يضمن تنفيذ العقد
                                ولا يتحمل مسؤولية النزاعات بينك وبين عميلك.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٥. الاشتراكات والفوترة</h2>
                            <p>
                                الخطة المجانية متاحة بدون اشتراك شهري. الخطة الاحترافية تكلف ٥ دولار أمريكي شهرياً.
                                يمكنك إلغاء اشتراكك الاحترافي في أي وقت والعودة للخطة المجانية فوراً.
                                لا توجد عقود سنوية أو رسوم خفية. عند الإلغاء، ستحتفظ بميزات الخطة الاحترافية
                                حتى نهاية فترة الاشتراك المدفوعة.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٦. الذكاء الاصطناعي</h2>
                            <p>
                                مُستحق يستخدم خدمات ذكاء اصطناعي (مثل Gemini API) لتقديم ميزات مثل فحص الاشتراكات
                                من البريد الإلكتروني، مساعد إلغاء الاشتراكات، والمساعد الذكي. نتائج الذكاء الاصطناعي
                                هي اقتراحات وقد لا تكون دقيقة دائماً. أنت مسؤول عن مراجعة أي بيانات يضيفها الذكاء الاصطناعي
                                قبل اعتمادها. تقدير الضرائب المعروض هو تقدير تقريبي فقط — يُرجى استشارة مستشار ضريبي.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٧. المحتوى والملكية الفكرية</h2>
                            <p>
                                أنت تحتفظ بملكية جميع البيانات التي تدخلها في مُستحق (روابط الدفع، العقود، سجلات الدخل والمصاريف).
                                مُستحق يحتفظ بملكية المنصة والتصميم والكود. يُمنع استخدام المنصة لأي نشاط غير قانوني
                                أو احتيالي أو مخالف للأنظمة المعمول بها في بلدك.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٨. إخلاء المسؤولية</h2>
                            <p>
                                مُستحق يُقدم "كما هو" بدون ضمانات من أي نوع. لا نضمن توفر المنصة في جميع الأوقات
                                أو خلوها من الأخطاء. مُستحق ليس مؤسسة مالية أو بنكاً أو مزود خدمات دفع.
                                نحن لا نتحمل مسؤولية أي خسائر ناتجة عن استخدام المنصة أو عدم إتمام معاملة.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٩. التعديلات</h2>
                            <p>
                                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنُبلغك بالتغييرات الجوهرية عبر البريد الإلكتروني
                                أو إشعار داخل المنصة. استمرارك في استخدام مُستحق بعد التعديل يعني موافقتك على الشروط المحدثة.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١٠. القانون المُطبّق</h2>
                            <p>
                                تخضع هذه الشروط لقوانين جمهورية مصر العربية. أي نزاع يُحل عبر التحكيم في القاهرة
                                وفقاً لقواعد مركز القاهرة الإقليمي للتحكيم التجاري الدولي.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١١. التواصل</h2>
                            <p>
                                لأي استفسار حول هذه الشروط، تواصل معنا عبر
                                <a href="mailto:support@mustahaq.app" className="text-teal-700 hover:underline" dir="ltr">
                                    {' '}support@mustahaq.app{' '}
                                </a>
                                أو من صفحة
                                <a href="/#contact" className="text-teal-700 hover:underline"> تواصل معنا </a>
                                على الموقع.
                            </p>
                        </section>
                    </div>
                </main>

                <footer className="border-t border-teal-100/80 bg-slate-50 px-4 py-10 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
                        <AppLogo className="h-8" />
                        <div className="flex flex-wrap justify-center gap-5 text-xs text-slate-500">
                            <Link href="/terms" className="font-semibold text-primary">
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
