import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { create } from '@/routes/contracts';

export default function ContractsCreate() {
    return (
        <>
            <Head title="إنشاء عقد" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

ContractsCreate.layout = {
    breadcrumbs: [
        {
            title: 'إنشاء عقد · الخطوة 1',
            href: create(),
        },
    ],
};
