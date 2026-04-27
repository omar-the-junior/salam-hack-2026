import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { index, show } from '@/routes/payment-links';

export default function PaymentLinksShow() {
    return (
        <>
            <Head title="رابط الدفع" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

PaymentLinksShow.layout = {
    breadcrumbs: [
        {
            title: 'روابط الدفع',
            href: index(),
        },
        {
            title: 'التفاصيل',
            href: show(1),
        },
    ],
};
