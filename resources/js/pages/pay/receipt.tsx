import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

export default function PayReceipt() {
    return (
        <>
            <Head title="الإيصال" />
            <div className="flex w-full flex-col gap-4 p-4">
                <div className="relative min-h-[40vh] overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

PayReceipt.layout = {
    title: 'الإيصال',
    description: 'شكراً لك على الدفع (مسودة)',
};
