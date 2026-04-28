import { Link } from '@inertiajs/react';
import { Landmark, Quote } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

/** Stitch / marketing side image (desktop login panel). */
const AUTH_SIDE_IMAGE =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDWc_wzwEEXn6SIfJsoawkYkgQPuzEdE-WwVqNtOiI083QfRTEBXjaGGhPFzyRttQj_MQrR1EDy6ENRdnHJwle57iXPKdyEhvMUbehr1eAUKdG5d7sUbLE4DeyWaTs_1LsF1rGNZyDO4p4JFkVMuXhEiQGpEBh59wN253zZMTsYlb7U9CaJnBy8BtZlvvNANZCHTF7uuWoQcj0RhWTp3OgJNuA8xKdql0DDTemNvYcqh3R-ca04j5YAPOat89RitGjcJnfI88kLpyA';

function AmbientGrid({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.04)_1px,transparent_1px)] bg-[length:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]',
                className,
            )}
            aria-hidden
        />
    );
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
    variant = 'narrow',
}: AuthLayoutProps) {
    const isSplit = variant === 'split';
    const showHeader = Boolean(title?.trim() || description?.trim());

    return (
        <div
            className={cn(
                'relative flex min-h-dvh items-center justify-center font-sans selection:bg-primary selection:text-primary-foreground',
                'bg-[#f7f3f2] p-4 md:p-8 dark:bg-background',
            )}
        >
            <AmbientGrid />

            {isSplit ? (
                <main
                    className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm md:flex-row"
                    dir="rtl"
                >
                    <section className="flex flex-1 flex-col justify-center p-8 md:p-12 lg:px-14">
                        <div className="mb-10 flex items-center gap-2">
                            <Link
                                href={home()}
                                className="flex items-center gap-2 text-foreground"
                            >
                                <AppLogo className="h-9" />
                            </Link>
                        </div>

                        {showHeader ? (
                            <div className="mb-10 space-y-2">
                                {title ? (
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[clamp(1.875rem,3vw,2.25rem)] md:leading-10">
                                        {title}
                                    </h1>
                                ) : null}
                                {description ? (
                                    <p className="text-base leading-relaxed text-muted-foreground">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        {children}
                    </section>

                    <section className="relative hidden min-h-[20rem] flex-1 md:flex md:min-h-[28rem]">
                        <img
                            alt=""
                            src={AUTH_SIDE_IMAGE}
                            className="absolute inset-0 size-full object-cover opacity-[0.85] mix-blend-multiply grayscale-[20%] dark:opacity-50 dark:mix-blend-normal dark:grayscale"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-muted/90 via-muted/40 to-transparent dark:from-background/95 dark:via-background/55 dark:to-transparent" />
                        <div className="relative z-10 mt-auto flex flex-col p-10 md:p-12">
                            <Quote
                                className="mb-4 size-8 text-primary opacity-80"
                                aria-hidden
                            />
                            <p className="text-xl font-bold leading-snug text-foreground">
                                &quot;نحن نبني الأدوات التي تمنحك الوضوح، لتتفرغ
                                أنت لبناء نجاحك.&quot;
                            </p>
                        </div>
                    </section>
                </main>
            ) : (
                <div className="relative z-10 w-full max-w-md" dir="rtl">
                    <main className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div
                            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-primary via-primary/40 to-transparent opacity-60"
                            aria-hidden
                        />
                        <div className="px-6 py-9 md:px-10 md:py-10">
                            <div className="mb-7 flex justify-center">
                                <Link href={home()} className="inline-flex items-center">
                                    <AppLogo className="h-9" />
                                </Link>
                            </div>
                            {showHeader ? (
                                <header className="mb-8 space-y-2 text-center">
                                    {title ? (
                                        <h1 className="text-xl font-semibold text-foreground md:text-2xl">
                                            {title}
                                        </h1>
                                    ) : null}
                                    {description ? (
                                        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                                            {description}
                                        </p>
                                    ) : null}
                                </header>
                            ) : null}
                            {children}
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}
