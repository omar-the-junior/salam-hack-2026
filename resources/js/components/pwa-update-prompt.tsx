import { useEffect } from 'react';
import { toast } from 'sonner';
import { usePwa } from '@/hooks/use-pwa';

/**
 * Mounts once in the app root. Shows a branded sonner toast when a new
 * service worker is waiting (i.e. a new deployment has been pushed).
 *
 * The user can click "تحديث" (Update) to reload and activate the new version,
 * or dismiss and continue on the current version until they reload manually.
 */
export function PwaUpdatePrompt() {
    const { needsRefresh, updateServiceWorker } = usePwa();

    useEffect(() => {
        if (!needsRefresh) {
            return;
        }

        toast('تحديث جديد متاح', {
            description: 'تم إصدار نسخة جديدة من التطبيق. أعد التحميل للحصول على أحدث الميزات.',
            duration: Infinity,
            action: {
                label: 'تحديث',
                onClick: () => updateServiceWorker(true),
            },
            cancel: {
                label: 'لاحقاً',
                onClick: () => {},
            },
        });
    }, [needsRefresh, updateServiceWorker]);

    return null;
}
