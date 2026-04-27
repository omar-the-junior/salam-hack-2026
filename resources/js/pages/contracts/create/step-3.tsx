import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { create } from '@/routes/contracts';
import { step2, step3 } from '@/routes/contracts/create';

export default function ContractsCreateStep3() {
    return (
        <>
            <Head title="إنشاء عقد — الشروط" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

ContractsCreateStep3.layout = {
    breadcrumbs: [
        {
            title: 'إنشاء عقد',
            href: create(),
        },
        {
            title: 'الخطوة 2 — المراحل',
            href: step2(),
        },
        {
            title: 'الخطوة 3 — الشروط',
            href: step3(),
        },
    ],
};
