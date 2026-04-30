import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
// import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="إعدادات المظهر" />

            <h1 className="sr-only">إعدادات المظهر</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="إعدادات المظهر"
                    description="تخصيص مظهر حسابك (فاتح / داكن / النظام)"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'إعدادات المظهر',
            // href: editAppearance(),
        },
    ],
};
