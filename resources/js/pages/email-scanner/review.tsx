import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { index, review } from '@/routes/email-scanner';

export default function EmailScannerReview() {
    return (
        <>
            <Head title="مراجعة نتائج المسح" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

EmailScannerReview.layout = {
    breadcrumbs: [
        {
            title: 'مسح البريد',
            href: index(),
        },
        {
            title: 'مراجعة',
            href: review(),
        },
    ],
};
