export type AppNotification = {
    id: string;
    data: {
        title: string;
        message: string;
        action_url?: string;
        [key: string]: unknown;
    };
    created_at: string;
    read_at: string | null;
};
