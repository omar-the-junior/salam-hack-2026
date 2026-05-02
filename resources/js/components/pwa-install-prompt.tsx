import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function PwaInstallPrompt() {
    const { isInstallable, installPWA } = usePWAInstall();
    const [isVisible, setIsVisible] = useState(false);
    const [hasDismissed, setHasDismissed] = useState(false);

    useEffect(() => {
        // Show the prompt if it's installable and hasn't been dismissed in this session
        if (isInstallable && !hasDismissed) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [isInstallable, hasDismissed]);

    const handleDismiss = () => {
        setIsVisible(false);
        setHasDismissed(true);
    };

    if (!isVisible) {
return null;
}

    return (
        <div className="fixed bottom-4 left-4 z-50 md:bottom-6 md:left-6 max-w-sm w-[calc(100%-2rem)] md:w-96 rounded-2xl border border-teal-100/80 bg-white/95 p-5 shadow-[0_20px_60px_rgba(16,42,67,0.10)] backdrop-blur-md" dir="rtl">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#102a43]">تثبيت مُستحق كتطبيق</h3>
                </div>
                <button 
                    onClick={handleDismiss}
                    className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <span className="sr-only">إغلاق</span>
                </button>
            </div>
            
            <p className="mt-3 pr-11 text-sm leading-relaxed text-slate-600">
                وصول أسرع، يعمل بدون إنترنت، وأيقونة على الشاشة الرئيسية.
            </p>
            
            <div className="mt-5 flex items-center justify-end gap-3">
                <button 
                    onClick={handleDismiss}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    ليس الآن
                </button>
                <button 
                    onClick={async () => {
                        await installPWA();
                        setIsVisible(false);
                    }}
                    className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 shadow-sm"
                >
                    تثبيت التطبيق
                </button>
            </div>
        </div>
    );
}
