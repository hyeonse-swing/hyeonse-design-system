'use client';

import { useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { SizeContext, useHdsSize } from './sizing.js';
import type { HdsSize } from './sizing.js';
import { Menu } from '@base-ui/react/menu';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { Toast as BaseToast } from '@base-ui/react/toast';

function Sized({ size, children }: { size?: HdsSize; children: (resolved: HdsSize) => ReactNode }) {
  const resolved = useHdsSize(size);
  return <SizeContext.Provider value={resolved}>{children(resolved)}</SizeContext.Provider>;
}

export type MenuEntry =
  | { kind: 'action'; id: string; label: string; onSelect: () => void; disabled?: boolean; danger?: boolean }
  | { kind: 'checkbox'; id: string; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }
  | { kind: 'separator'; id: string }
  | { kind: 'submenu'; id: string; label: string; items: readonly MenuEntry[]; disabled?: boolean };

type MenuParts = Pick<typeof Menu, 'Item' | 'CheckboxItem' | 'CheckboxItemIndicator' | 'Separator' | 'SubmenuRoot' | 'SubmenuTrigger' | 'Portal' | 'Positioner' | 'Popup'>;

function renderMenuEntries(entries: readonly MenuEntry[], parts: MenuParts, size: HdsSize): ReactNode {
  const { Item, CheckboxItem, CheckboxItemIndicator, Separator, SubmenuRoot, SubmenuTrigger, Portal, Positioner, Popup } = parts;
  return entries.map(entry => {
    if (entry.kind === 'separator') return <Separator key={entry.id} className="hds-menu__separator" />;
    if (entry.kind === 'action') return <Item key={entry.id} disabled={entry.disabled} onClick={entry.onSelect}
      className={`hds-menu__item${entry.danger ? ' hds-menu__item--danger' : ''}`}>{entry.label}</Item>;
    if (entry.kind === 'checkbox') return <CheckboxItem key={entry.id} checked={entry.checked}
      onCheckedChange={entry.onCheckedChange} disabled={entry.disabled} className="hds-menu__item">
      <span className="hds-menu__check" aria-hidden="true"><CheckboxItemIndicator>✓</CheckboxItemIndicator></span>{entry.label}
    </CheckboxItem>;
    return <SubmenuRoot key={entry.id}>
      <SubmenuTrigger disabled={entry.disabled} className="hds-menu__item hds-menu__item--submenu">
        {entry.label}<span aria-hidden="true">›</span>
      </SubmenuTrigger>
      <Portal><Positioner sideOffset={4} data-hds-size={size} className="hds-menu__positioner">
        <Popup className="hds-menu__popup">{renderMenuEntries(entry.items, parts, size)}</Popup>
      </Positioner></Portal>
    </SubmenuRoot>;
  });
}

export type DropdownMenuProps = {
  trigger: ReactElement;
  items: readonly MenuEntry[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: HdsSize;
};

export function DropdownMenu({ size, trigger, items, open, defaultOpen, onOpenChange }: DropdownMenuProps) {
  return <Sized size={size}>{resolved => <Menu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <Menu.Trigger render={trigger} />
    <Menu.Portal><Menu.Positioner sideOffset={6} align="start" data-hds-size={resolved} className="hds-menu__positioner">
      <Menu.Popup className="hds-menu__popup">{renderMenuEntries(items, Menu, resolved)}</Menu.Popup>
    </Menu.Positioner></Menu.Portal>
  </Menu.Root>}</Sized>;
}

export type ContextMenuProps = {
  trigger: ReactElement;
  items: readonly MenuEntry[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: HdsSize;
};

export function ContextMenu({ size, trigger, items, open, defaultOpen, onOpenChange }: ContextMenuProps) {
  return <Sized size={size}>{resolved => <BaseContextMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <BaseContextMenu.Trigger render={trigger} />
    <BaseContextMenu.Portal><BaseContextMenu.Positioner data-hds-size={resolved} className="hds-menu__positioner">
      <BaseContextMenu.Popup className="hds-menu__popup">{renderMenuEntries(items, BaseContextMenu, resolved)}</BaseContextMenu.Popup>
    </BaseContextMenu.Positioner></BaseContextMenu.Portal>
  </BaseContextMenu.Root>}</Sized>;
}

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

function dialogContent({ title, description, children, footer, closeLabel = '닫기' }: Pick<DialogProps, 'title' | 'description' | 'children' | 'footer' | 'closeLabel'>) {
  return <>
    <header className="hds-dialog__header">
      <div><BaseDialog.Title className="hds-dialog__title">{title}</BaseDialog.Title>
        {description && <BaseDialog.Description className="hds-dialog__description">{description}</BaseDialog.Description>}
      </div>
      <BaseDialog.Close type="button" className="hds-dialog__close" aria-label={closeLabel}><span aria-hidden="true">×</span></BaseDialog.Close>
    </header>
    {children && <div className="hds-dialog__body">{children}</div>}
    {footer && <div className="hds-dialog__footer">{footer}</div>}
  </>;
}

export function Dialog({ size, trigger, title, description, children, footer, closeLabel = '닫기', open, defaultOpen, onOpenChange }: DialogProps) {
  return <Sized size={size}>{resolved => <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <BaseDialog.Trigger render={trigger} />
    <BaseDialog.Portal data-hds-size={resolved} className="hds-dialog__portal">
      <BaseDialog.Backdrop className="hds-dialog__backdrop" />
      <BaseDialog.Popup className="hds-dialog__popup">{dialogContent({ title, description, children, footer, closeLabel })}</BaseDialog.Popup>
    </BaseDialog.Portal>
  </BaseDialog.Root>}</Sized>;
}

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

export function AlertDialog({ size, trigger, title, description, children, confirmLabel, cancelLabel, onConfirm, onError,
  pending = false, confirmDisabled = false, open, defaultOpen = false, onOpenChange }: AlertDialogProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const [confirming, setConfirming] = useState(false);
  const confirmingRef = useRef(false);
  const busy = pending || confirming;
  const currentOpen = open ?? localOpen;
  const changeOpen = (next: boolean) => {
    if (busy && !next) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  const confirm = async () => {
    if (busy || confirmingRef.current || confirmDisabled) return;
    confirmingRef.current = true;
    setConfirming(true);
    try {
      await onConfirm();
      if (open === undefined) setLocalOpen(false);
      onOpenChange?.(false);
    } catch (error) {
      onError?.(error);
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  };
  return <Sized size={size}>{resolved => <BaseAlertDialog.Root open={currentOpen} onOpenChange={changeOpen}>
    <BaseAlertDialog.Trigger render={trigger} />
    <BaseAlertDialog.Portal data-hds-size={resolved} className="hds-dialog__portal">
      <BaseAlertDialog.Backdrop className="hds-dialog__backdrop" />
      <BaseAlertDialog.Popup className="hds-dialog__popup hds-alertDialog__popup" aria-busy={busy || undefined}>
        <BaseAlertDialog.Title className="hds-dialog__title">{title}</BaseAlertDialog.Title>
        {description && <BaseAlertDialog.Description className="hds-dialog__description">{description}</BaseAlertDialog.Description>}
        {children && <div className="hds-dialog__body">{children}</div>}
        <div className="hds-dialog__footer">
          <BaseAlertDialog.Close type="button" disabled={busy} className="hds-overlayButton">{cancelLabel}</BaseAlertDialog.Close>
          <button type="button" disabled={busy || confirmDisabled} onClick={confirm}
            className="hds-overlayButton hds-overlayButton--danger">{confirmLabel}</button>
        </div>
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  </BaseAlertDialog.Root>}</Sized>;
}

export type SheetProps = DialogProps & {
  side?: 'left' | 'right';
  size?: HdsSize;
};

export function Sheet({ trigger, title, description, children, footer, closeLabel = '닫기', side = 'right', size, open, defaultOpen, onOpenChange }: SheetProps) {
  return <Sized size={size}>{resolved => <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <BaseDialog.Trigger render={trigger} />
    <BaseDialog.Portal data-hds-size={resolved} className="hds-dialog__portal">
      <BaseDialog.Backdrop className="hds-dialog__backdrop" />
      <BaseDialog.Popup className={`hds-dialog__popup hds-sheet__popup hds-sheet__popup--${side} hds-sheet__popup--${resolved}`}>
        {dialogContent({ title, description, children, footer, closeLabel })}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  </BaseDialog.Root>}</Sized>;
}

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

export function Popover({ size, trigger, title, description, children, closeLabel = '닫기', open, defaultOpen, onOpenChange }: PopoverProps) {
  return <Sized size={size}>{resolved => <BasePopover.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <BasePopover.Trigger render={trigger} />
    <BasePopover.Portal><BasePopover.Positioner sideOffset={8} align="start" data-hds-size={resolved} className="hds-popover__positioner">
      <BasePopover.Popup className="hds-popover__popup">
        <div className="hds-popover__header"><BasePopover.Title className="hds-dialog__title">{title}</BasePopover.Title>
          <BasePopover.Close type="button" className="hds-dialog__close" aria-label={closeLabel}><span aria-hidden="true">×</span></BasePopover.Close></div>
        {description && <BasePopover.Description className="hds-dialog__description">{description}</BasePopover.Description>}
        {children && <div className="hds-popover__body">{children}</div>}
      </BasePopover.Popup>
    </BasePopover.Positioner></BasePopover.Portal>
  </BasePopover.Root>}</Sized>;
}

export type TooltipProps = {
  trigger: ReactElement;
  content: string;
  delay?: number;
  size?: HdsSize;
};

export function Tooltip({ size, trigger, content, delay }: TooltipProps) {
  return <Sized size={size}>{resolved => <BaseTooltip.Provider><BaseTooltip.Root>
    <BaseTooltip.Trigger render={trigger} delay={delay} />
    <BaseTooltip.Portal><BaseTooltip.Positioner sideOffset={6} data-hds-size={resolved} className="hds-tooltip__positioner">
      <BaseTooltip.Popup className="hds-tooltip__popup">{content}</BaseTooltip.Popup>
    </BaseTooltip.Positioner></BaseTooltip.Portal>
  </BaseTooltip.Root></BaseTooltip.Provider>}</Sized>;
}

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

function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map(toast => <BaseToast.Root key={toast.id} toast={toast} className="hds-toast" swipeDirection="right">
    <BaseToast.Content className="hds-toast__content">
      <div className="hds-toast__text"><BaseToast.Title className="hds-toast__title" />
        <BaseToast.Description className="hds-toast__description" /></div>
      {/* HDS shows the entire toast, including its close control, before hover or F6. */}
      <BaseToast.Close type="button" className="hds-toast__close" aria-label={closeLabel} aria-hidden={false}><span aria-hidden="true">×</span></BaseToast.Close>
    </BaseToast.Content>
  </BaseToast.Root>);
}

export function ToastProvider({ size, children, viewportLabel = '알림', closeLabel = '알림 닫기', timeout = 5000, limit = 3 }: ToastProviderProps) {
  return <Sized size={size}>{resolved => <BaseToast.Provider timeout={timeout} limit={limit}>
    {children}
    <BaseToast.Portal><BaseToast.Viewport data-hds-size={resolved} className="hds-toast__viewport" aria-label={viewportLabel}><ToastList closeLabel={closeLabel} /></BaseToast.Viewport></BaseToast.Portal>
  </BaseToast.Provider>}</Sized>;
}

export function useToast(): { add: (message: ToastMessage) => string; close: (id: string) => void } {
  const manager = BaseToast.useToastManager();
  return {
    add: message => manager.add({ title: message.title, description: message.description, type: message.tone, timeout: message.timeout }),
    close: id => manager.close(id),
  };
}
