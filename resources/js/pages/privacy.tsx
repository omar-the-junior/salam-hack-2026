import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';

export default function Privacy() {
    return (
        <>
            <Head title="سياسة الخصوصية — مُسْتَحَقّ">
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
                    <h1 className="font-display text-3xl text-[#102a43] md:text-4xl">سياسة الخصوصية</h1>
                    <p className="mt-2 text-sm text-slate-500">آخر تحديث: ١ مايو ٢٠٢٦</p>

                    <div className="mt-10 space-y-8 text-sm leading-8 text-slate-700">
                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١. من نحن</h2>
                            <p>
                                مُستحق هي منصة إدارة مالية للمستقلين وأصحاب الأعمال الصغيرة في منطقة الشرق الأوسط وشمال أفريقيا.
                                نحن نلتزم بحماية خصوصيتك وبياناتك الشخصية وفقاً لقانون حماية البيانات الشخصية المصري
                                (رقم ١٥١ لسنة ٢٠٢٠) والممارسات الدولية لأمن البيانات.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٢. البيانات التي نجمعها</h2>
                            <p>نجمع البيانات التالية عند استخدامك للمنصة:</p>
                            <ul className="mt-2 list-disc space-y-1 pr-5">
                                <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، البلد، العملة المفضلة، المهنة</li>
                                <li><strong>بيانات مالية:</strong> روابط الدفع، العقود، سجلات الدخل والمصاريف التي تدخلها</li>
                                <li><strong>بيانات الجلسة:</strong> عنوان IP، نوع المتصفح، سجل الاستخدام</li>
                                <li><strong>بيانات البريد الإلكتروني:</strong> فقط عند ربطك لحساب Gmail — نقرأ فواتير الاشتراكات فقط (صلاحية قراءة فقط)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٣. كيف نستخدم بياناتك</h2>
                            <p>نستخدم بياناتك للأغراض التالية فقط:</p>
                            <ul className="mt-2 list-disc space-y-1 pr-5">
                                <li>تشغيل ميزات المنصة (إنشاء روابط الدفع، العقود، تقارير الدخل)</li>
                                <li>فحص فواتير الاشتراكات من بريدك الإلكتروني عبر الذكاء الاصطناعي</li>
                                <li>إرسال تنبيهات التجديد والتذكيرات التي طلبتها</li>
                                <li>تحسين المنصة وتجربة المستخدم</li>
                                <li>إرسال إشعارات مهمة عن حسابك أو تغييرات في الخدمة</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٤. ربط Gmail والذكاء الاصطناعي</h2>
                            <p>
                                عند ربط حساب Gmail، نطلب صلاحية <strong>قراءة فقط</strong> (read-only).
                                نستخدم Gmail API لفحص رسائل الفواتير والاشتراكات فقط — لا نقرأ رسائلك الشخصية.
                                الذكاء الاصطناعي (Gemini API) يعالج بيانات الفواتير لاستخراج معلومات الاشتراكات
                                (اسم الخدمة، المبلغ، العملة، دورة الفوترة). نتائج الذكاء الاصطناعي تُعرض لك
                                للمراجعة والاعتماد قبل حفظها. لا نشارك محتوى بريدك مع أي طرف ثالث.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٥. معالجة المدفوعات</h2>
                            <p>
                                مُستحق لا يخزّن بيانات بطاقات الدفع. جميع المعاملات تتم عبر بوابات دفع معتمدة
                                (مثل Paymob) التي تتوافق مع معايير PCI-DSS. بيانات الدفع تُشفّر أثناء النقل
                                باستخدام TLS 1.3. نحتفظ بسجل حالة المعاملة فقط (مبلغ، عملة، حالة الدفع) لأغراض التتبع.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٦. مشاركة البيانات</h2>
                            <p>لا نبيع أو نؤجر بياناتك الشخصية. قد نشارك بياناتك فقط مع:</p>
                            <ul className="mt-2 list-disc space-y-1 pr-5">
                                <li><strong>بوابات الدفع:</strong> لمعالجة معاملاتك (مثل Paymob)</li>
                                <li><strong>مزودي الذكاء الاصطناعي:</strong> لمعالجة فواتير الاشتراكات (مثل Google Gemini API)</li>
                                <li><strong>مزودي الاستضافة:</strong> لتخزين بياناتك بشكل آمن</li>
                                <li><strong>الجهات القانونية:</strong> فقط إذا طلب ذلك القانون أو أمر قضائي</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٧. أمن البيانات</h2>
                            <p>
                                نتخذ إجراءات أمنية تشمل: تشفير البيانات أثناء النقل (TLS) وعند التخزين (AES-256)،
                                تقييد الوصول للبيانات على أساس الحاجة (need-to-know)، مراقبة الأنشطة المشبوهة،
                                ونسخ احتياطي يومي مشفر. رغم ذلك، لا يوجد نظام آمن ١٠٠٪ ونوصي باستخدام كلمات مرور قوية
                                وتفعيل المصادقة الثنائية.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٨. حقوقك</h2>
                            <p>لك الحق في:</p>
                            <ul className="mt-2 list-disc space-y-1 pr-5">
                                <li>الوصول لبياناتك الشخصية المخزنة لدينا</li>
                                <li>طلب تصحيح بيانات غير صحيحة</li>
                                <li>طلب حذف حسابك وبياناتك (خلال ٣٠ يوماً)</li>
                                <li>فصل ربط Gmail في أي وقت من إعدادات الحساب</li>
                                <li>تصدير بياناتك (سجلات الدخل والمصاريف) بصيغة CSV</li>
                                <li>الاعتراض على معالجة بياناتك لأغراض التسويق</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">٩. ملفات تعريف الارتباط (Cookies)</h2>
                            <p>
                                نستخدم ملفات تعريف الارتباط الأساسية لتشغيل المنصة (جلسة المستخدم، الأمان)
                                وملفات تحليلية مجهولة لتحسين التجربة. لا نستخدم ملفات تعريف الارتباط للإعلانات.
                                يمكنك تعطيل ملفات تعريف الارتباط في إعدادات متصفحك، لكن بعض ميزات المنصة قد لا تعمل بشكل صحيح.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١٠. الاحتفاظ بالبيانات</h2>
                            <p>
                                نحتفظ ببياناتك طالما حسابك نشط. عند حذف حسابك، نحذف بياناتك الشخصية خلال ٣٠ يوماً
                                مع الاحتفاظ بسجلات المعاملات المالية للفترة المطلوبة قانونياً (٥ سنوات).
                                بيانات البريد الإلكتروني المفحوصة تُحذف فور فصل ربط Gmail.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١١. التحديثات على هذه السياسة</h2>
                            <p>
                                قد نحدّث هذه السياسة دورياً. سنُبلغك بالتغييرات الجوهرية عبر البريد الإلكتروني
                                أو إشعار بارز في المنصة قبل ١٥ يوماً من تفعيلها. نشرح دائماً ما تغيّر ولماذا.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-xl text-[#102a43]">١٢. التواصل</h2>
                            <p>
                                لأي سؤال حول خصوصيتك، راسلنا عبر
                                <a href="mailto:privacy@mustahaq.app" className="text-teal-700 hover:underline" dir="ltr">
                                    {' '}privacy@mustahaq.app{' '}
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
                            <Link href="/terms" className="hover:text-primary">
                                الشروط والأحكام
                            </Link>
                            <Link href="/privacy" className="font-semibold text-primary">
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
