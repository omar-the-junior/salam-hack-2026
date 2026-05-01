import { Link } from '@inertiajs/react';
import { CheckCircle2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    create as contractCreateRoute,
    edit as contractEditRoute,
} from '@/routes/contracts';
import {
    milestones as contractMilestonesRoute,
    summary as contractSummaryRoute,
} from '@/routes/contracts/create';

export type ContractWizardStepperProps = {
    currentStep: 1 | 2 | 3;
    /** Draft contract id when the wizard has progressed past step 1 */
    contractId?: string | null;
    /** When false and contract exists, step 2 targets milestone composition */
    disableStepTwoNavigation?: boolean;
    /** Explicit URL for step 3 (defaults to wizard summary when contractId is set) */
    stepThreeHref?: string | null;
    className?: string;
};

type StepVisualState = 'complete' | 'current' | 'upcoming';

function stepVisualState(
    step: 1 | 2 | 3,
    currentStep: 1 | 2 | 3,
): StepVisualState {
    if (step === currentStep) {
        return 'current';
    }

    if (step < currentStep) {
        return 'complete';
    }

    return 'upcoming';
}

export function ContractWizardStepper({
    currentStep,
    contractId = null,
    disableStepTwoNavigation = false,
    stepThreeHref = null,
    className,
}: ContractWizardStepperProps) {
    const step1Href = contractId
        ? contractEditRoute.url({ contract: contractId })
        : contractCreateRoute.url();

    const step2Href =
        contractId && !disableStepTwoNavigation
            ? contractMilestonesRoute.url({
                  query: { contract_id: contractId },
              })
            : null;

    const resolvedStepThree =
        stepThreeHref ??
        (contractId
            ? contractSummaryRoute.url({
                  query: { contract_id: contractId },
              })
            : null);

    const steps: Array<{
        key: 1 | 2 | 3;
        label: string;
        href: string | null;
        disabledReason: string | null;
    }> = [
        {
            key: 1,
            label: 'المشروع والعميل',
            href: currentStep === 1 ? null : step1Href,
            disabledReason: null,
        },
        {
            key: 2,
            label: 'مراحل الدفع',
            href:
                currentStep === 2
                    ? null
                    : step2Href && contractId
                      ? step2Href
                      : null,
            disabledReason: !contractId
                ? 'أنشئ المسودة أولاً باستخدام زر «التالي».'
                : disableStepTwoNavigation
                  ? 'تم إعداد المراحل لهذا العقد. عدّلها من صفحة العقد.'
                  : null,
        },
        {
            key: 3,
            label: 'المراجعة والمشاركة',
            href:
                currentStep === 3
                    ? null
                    : resolvedStepThree && contractId
                      ? resolvedStepThree
                      : null,
            disabledReason: !contractId
                ? 'يتاح بعد حفظ بيانات العقد.'
                : null,
        },
    ];

    return (
        <nav
            aria-label="خطوات إنشاء العقد"
            className={cn('w-full', className)}
        >
            <ol className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-2">
                {steps.map((step, index) => {
                    const visual = stepVisualState(step.key, currentStep);
                    const isInteractive =
                        Boolean(step.href) &&
                        step.href !== null &&
                        visual !== 'current';

                    const badge = (
                        <span
                            className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                                visual === 'current' &&
                                    'bg-primary text-primary-foreground',
                                visual === 'complete' &&
                                    'bg-primary/15 text-primary',
                                visual === 'upcoming' &&
                                    'bg-muted text-muted-foreground',
                            )}
                            aria-hidden
                        >
                            {visual === 'complete' ? (
                                <CheckCircle2Icon className="size-4" />
                            ) : (
                                step.key
                            )}
                        </span>
                    );

                    const labelEl = (
                        <span
                            className={cn(
                                'text-start text-sm leading-snug',
                                visual === 'current' &&
                                    'text-primary font-semibold',
                                visual !== 'current' &&
                                    'text-muted-foreground',
                            )}
                        >
                            {step.label}
                        </span>
                    );

                    const row = (
                        <span className="flex items-center gap-3 md:max-w-44">
                            {badge}
                            {labelEl}
                        </span>
                    );

                    let body: ReactNode;

                    if (visual === 'current') {
                        body = (
                            <span
                                className="flex w-full items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 md:inline-flex md:w-auto md:border-0 md:bg-transparent md:p-0"
                                aria-current="step"
                            >
                                {row}
                            </span>
                        );
                    } else if (isInteractive && step.href) {
                        body = (
                            <Button
                                variant="ghost"
                                className="h-auto min-h-11 w-full justify-start gap-0 px-3 py-2 font-normal md:w-auto"
                                asChild
                            >
                                <Link href={step.href} prefetch>
                                    {row}
                                </Link>
                            </Button>
                        );
                    } else if (step.disabledReason) {
                        body = (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        tabIndex={0}
                                        className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 opacity-60 md:inline-flex md:w-auto"
                                        aria-disabled
                                    >
                                        <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                            {step.key}
                                        </span>
                                        {labelEl}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                    {step.disabledReason}
                                </TooltipContent>
                            </Tooltip>
                        );
                    } else {
                        body = (
                            <span className="flex w-full items-center gap-3 px-3 py-2 opacity-70 md:inline-flex md:w-auto">
                                {row}
                            </span>
                        );
                    }

                    return (
                        <li
                            key={step.key}
                            className="flex flex-1 flex-col items-stretch md:flex-initial md:items-center"
                        >
                            <div className="flex w-full items-center gap-2 md:w-auto">
                                {body}
                                {index < steps.length - 1 ? (
                                    <span
                                        className="bg-border hidden h-px w-6 shrink-0 md:block"
                                        aria-hidden
                                    />
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-center text-xs md:text-sm">
                الخطوة {currentStep} من 3
            </p>
        </nav>
    );
}
