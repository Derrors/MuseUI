import React from 'react';
import IconLoader from './IconLoader';
import { AlertDialogShell, Button, Card, Flex, Text } from './ui';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
    notifications: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onClose }) => {
    const tone = (type: ToastMessage['type']) => {
        if (type === 'success') return { color: 'var(--green-9)', icon: 'check' as const };
        if (type === 'error') return { color: 'var(--red-9)', icon: 'x' as const };
        return { color: 'var(--ruby-9)', icon: 'info' as const };
    };

    return (
        <div className="fixed top-4 left-1/2 z-[200] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 pointer-events-none px-3">
            {notifications.map(n => (
                <Card
                    key={n.id}
                    className="pointer-events-auto w-full animate-in fade-in slide-in-from-top-2 shadow-xl"
                >
                    <Flex align="center" gap="3">
                        <IconLoader name={tone(n.type).icon} size={16} style={{ color: tone(n.type).color } as React.CSSProperties} />
                        <Text size="2" weight="medium" className="min-w-0 flex-1">{n.message}</Text>
                        <Button onClick={() => onClose(n.id)} variant="ghost" color="gray" size="1" aria-label="Close notification">
                            <IconLoader name="x" size={14} />
                        </Button>
                    </Flex>
                </Card>
            ))}
        </div>
    );
};

interface ConfirmationProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    lang: 'zh' | 'en';
}

export const ConfirmationDialog: React.FC<ConfirmationProps> = ({ isOpen, title, message, onConfirm, onCancel, lang }) => {
    return (
        <AlertDialogShell
            open={isOpen}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={title}
            description={message}
            cancelLabel={lang === 'zh' ? '取消' : 'Cancel'}
            confirmLabel={lang === 'zh' ? '确认' : 'Confirm'}
            destructive
            onConfirm={onConfirm}
        />
    );
};
