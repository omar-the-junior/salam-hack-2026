import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import type { AuthLayoutVariant } from '@/types';

export default function AuthLayout({
    title = '',
    description = '',
    variant = 'narrow',
    children,
}: {
    title?: string;
    description?: string;
    variant?: AuthLayoutVariant;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            variant={variant}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
