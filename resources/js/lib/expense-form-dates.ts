export const EXPENSE_DATE_ORDER_MESSAGE_AR =
    'تاريخ التجديد القادم يجب ألا يكون قبل تاريخ البداية.';

export function parseYmdToDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

export function formatDateToYmd(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function formatOptionalExpenseDateLabel(value: string, emptyLabel: string): string {
    const date = parseYmdToDate(value);

    if (!date) {
        return emptyLabel;
    }

    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export function compareExpenseYmd(a: string, b: string): number {
    const da = parseYmdToDate(a);
    const db = parseYmdToDate(b);

    if (!da || !db) {
        return 0;
    }

    return da.getTime() - db.getTime();
}
