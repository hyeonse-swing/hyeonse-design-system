import type { ReactElement, ReactNode } from 'react';
import type { HdsSize } from './sizing.js';
export type MenuEntry = {
    kind: 'action';
    id: string;
    label: string;
    onSelect: () => void;
    disabled?: boolean;
    danger?: boolean;
} | {
    kind: 'checkbox';
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
} | {
    kind: 'separator';
    id: string;
} | {
    kind: 'submenu';
    id: string;
    label: string;
    items: readonly MenuEntry[];
    disabled?: boolean;
};
export type DropdownMenuProps = {
    trigger: ReactElement;
    items: readonly MenuEntry[];
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: HdsSize;
};
export declare function DropdownMenu({ size, trigger, items, open, defaultOpen, onOpenChange }: DropdownMenuProps): import("react").JSX.Element;
export type ContextMenuProps = {
    trigger: ReactElement;
    items: readonly MenuEntry[];
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: HdsSize;
};
export declare function ContextMenu({ size, trigger, items, open, defaultOpen, onOpenChange }: ContextMenuProps): import("react").JSX.Element;
export type DialogProps = {
    trigger: ReactElement;
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
    closeLabel?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: HdsSize;
};
export declare function Dialog({ size, trigger, title, description, children, footer, closeLabel, open, defaultOpen, onOpenChange }: DialogProps): import("react").JSX.Element;
/** Native modal alternative for journeys that do not need Base UI's popup composition. */
export declare function NativeDialog({ size, trigger, title, description, children, footer, closeLabel, open, defaultOpen, onOpenChange }: DialogProps): import("react").JSX.Element;
export type AlertDialogProps = {
    trigger: ReactElement;
    title: string;
    description?: string;
    children?: ReactNode;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void | Promise<void>;
    onError?: (error: unknown) => void;
    pending?: boolean;
    confirmDisabled?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: HdsSize;
};
export declare function AlertDialog({ size, trigger, title, description, children, confirmLabel, cancelLabel, onConfirm, onError, pending, confirmDisabled, open, defaultOpen, onOpenChange }: AlertDialogProps): import("react").JSX.Element;
export type SheetProps = DialogProps & {
    side?: 'left' | 'right';
    size?: HdsSize;
};
export declare function Sheet({ trigger, title, description, children, footer, closeLabel, side, size, open, defaultOpen, onOpenChange }: SheetProps): import("react").JSX.Element;
export type PopoverProps = {
    trigger: ReactElement;
    title: string;
    description?: string;
    children?: ReactNode;
    closeLabel?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: HdsSize;
};
export declare function Popover({ size, trigger, title, description, children, closeLabel, open, defaultOpen, onOpenChange }: PopoverProps): import("react").JSX.Element;
export type TooltipProps = {
    trigger: ReactElement;
    content: string;
    delay?: number;
    size?: HdsSize;
};
export declare function Tooltip({ size, trigger, content, delay }: TooltipProps): import("react").JSX.Element;
export type ToastMessage = {
    title: string;
    description?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
    timeout?: number;
};
export type ToastProviderProps = {
    children: ReactNode;
    viewportLabel?: string;
    closeLabel?: string;
    timeout?: number;
    limit?: number;
    size?: HdsSize;
};
export declare function ToastProvider({ size, children, viewportLabel, closeLabel, timeout, limit }: ToastProviderProps): import("react").JSX.Element;
export declare function useToast(): {
    add: (message: ToastMessage) => string;
    close: (id: string) => void;
};
