import { useEffect, useRef, useState } from 'react';

type ScanStatus = {
    status: 'none' | 'queued' | 'in_progress' | 'completed' | 'failed';
    found_count?: number | null;
    error?: string | null;
};

export function useEmailScanStatus(
    initialScan: ScanStatus | null,
    onComplete?: (data: ScanStatus) => void,
    onFailed?: (data: ScanStatus) => void,
) {
    const [scan, setScan] = useState<ScanStatus | null>(initialScan);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Track the scan id we last fired callbacks for to avoid double-firing on re-renders
    const firedForStatus = useRef<string | null>(null);

    const isRunning = scan?.status === 'queued' || scan?.status === 'in_progress';

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        intervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(route('email-scanner.status'));
                const data: ScanStatus = await res.json();
                setScan(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }

                    const key = data.status;
                    if (firedForStatus.current !== key) {
                        firedForStatus.current = key;
                        if (data.status === 'completed') {
                            onComplete?.(data);
                        } else {
                            onFailed?.(data);
                        }
                    }
                }
            } catch {
                // Silently ignore fetch errors during polling
            }
        }, 5000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    return { scan, setScan, isRunning };
}
