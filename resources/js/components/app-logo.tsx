type AppLogoProps = {
    variant?: 'primary' | 'white';
    className?: string;
};

export default function AppLogo({
    variant = 'primary',
    className = '',
}: AppLogoProps) {
    const src =
        variant === 'white'
            ? '/logo/logo-full-white.svg'
            : '/logo/logo-full-primary.svg';

    return (
        <img
            src={src}
            alt="Mustahaq"
            className={`h-8 w-auto ${className}`.trim()}
        />
    );
}
