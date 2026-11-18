'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cloneElement, useId, useLayoutEffect, useRef, useState } from 'react';
import { SizeContext, useHdsSize } from './sizing.js';
import { Menu } from '@base-ui/react/menu';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { Toast as BaseToast } from '@base-ui/react/toast';
function Sized({ size, children }) {
    const resolved = useHdsSize(size);
    return _jsx(SizeContext.Provider, { value: resolved, children: children(resolved) });
}
function renderMenuEntries(entries, parts, size) {
    const { Item, CheckboxItem, CheckboxItemIndicator, Separator, SubmenuRoot, SubmenuTrigger, Portal, Positioner, Popup } = parts;
    return entries.map(entry => {
        if (entry.kind === 'separator')
            return _jsx(Separator, { className: "hds-menu__separator" }, entry.id);
        if (entry.kind === 'action')
            return _jsx(Item, { disabled: entry.disabled, onClick: entry.onSelect, className: `hds-menu__item${entry.danger ? ' hds-menu__item--danger' : ''}`, children: entry.label }, entry.id);
        if (entry.kind === 'checkbox')
            return _jsxs(CheckboxItem, { checked: entry.checked, onCheckedChange: entry.onCheckedChange, disabled: entry.disabled, className: "hds-menu__item", children: [_jsx("span", { className: "hds-menu__check", "aria-hidden": "true", children: _jsx(CheckboxItemIndicator, { children: "\u2713" }) }), entry.label] }, entry.id);
        return _jsxs(SubmenuRoot, { children: [_jsxs(SubmenuTrigger, { disabled: entry.disabled, className: "hds-menu__item hds-menu__item--submenu", children: [entry.label, _jsx("span", { "aria-hidden": "true", children: "\u203A" })] }), _jsx(Portal, { children: _jsx(Positioner, { sideOffset: 4, "data-hds-size": size, className: "hds-menu__positioner", children: _jsx(Popup, { className: "hds-menu__popup", children: renderMenuEntries(entry.items, parts, size) }) }) })] }, entry.id);
    });
}
export function DropdownMenu({ size, trigger, items, open, defaultOpen, onOpenChange }) {
    return _jsx(Sized, { size: size, children: resolved => _jsxs(Menu.Root, { open: open, defaultOpen: defaultOpen, onOpenChange: onOpenChange, children: [_jsx(Menu.Trigger, { render: trigger }), _jsx(Menu.Portal, { children: _jsx(Menu.Positioner, { sideOffset: 6, align: "start", "data-hds-size": resolved, className: "hds-menu__positioner", children: _jsx(Menu.Popup, { className: "hds-menu__popup", children: renderMenuEntries(items, Menu, resolved) }) }) })] }) });
}
export function ContextMenu({ size, trigger, items, open, defaultOpen, onOpenChange }) {
    return _jsx(Sized, { size: size, children: resolved => _jsxs(BaseContextMenu.Root, { open: open, defaultOpen: defaultOpen, onOpenChange: onOpenChange, children: [_jsx(BaseContextMenu.Trigger, { render: trigger }), _jsx(BaseContextMenu.Portal, { children: _jsx(BaseContextMenu.Positioner, { "data-hds-size": resolved, className: "hds-menu__positioner", children: _jsx(BaseContextMenu.Popup, { className: "hds-menu__popup", children: renderMenuEntries(items, BaseContextMenu, resolved) }) }) })] }) });
}
function dialogContent({ title, description, children, footer, closeLabel = '닫기' }) {
    return _jsxs(_Fragment, { children: [_jsxs("header", { className: "hds-dialog__header", children: [_jsxs("div", { children: [_jsx(BaseDialog.Title, { className: "hds-dialog__title", children: title }), description && _jsx(BaseDialog.Description, { className: "hds-dialog__description", children: description })] }), _jsx(BaseDialog.Close, { type: "button", className: "hds-dialog__close", "aria-label": closeLabel, children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }), children && _jsx("div", { className: "hds-dialog__body", children: children }), footer && _jsx("div", { className: "hds-dialog__footer", children: footer })] });
}
export function Dialog({ size, trigger, title, description, children, footer, closeLabel = '닫기', open, defaultOpen, onOpenChange }) {
    return _jsx(Sized, { size: size, children: resolved => _jsxs(BaseDialog.Root, { open: open, defaultOpen: defaultOpen, onOpenChange: onOpenChange, children: [_jsx(BaseDialog.Trigger, { render: trigger }), _jsxs(BaseDialog.Portal, { "data-hds-size": resolved, className: "hds-dialog__portal", children: [_jsx(BaseDialog.Backdrop, { className: "hds-dialog__backdrop" }), _jsx(BaseDialog.Popup, { className: "hds-dialog__popup", children: dialogContent({ title, description, children, footer, closeLabel }) })] })] }) });
}
function nativeDialogTabStops(dialog) {
    const candidates = Array.from(dialog.querySelectorAll('a[href], button, input, select, textarea, summary, [contenteditable], [tabindex]'))
        .filter(element => (element.tabIndex >= 0 || (element.hasAttribute('contenteditable') && element.isContentEditable && !element.parentElement?.isContentEditable))
        && !element.matches(':disabled') && !element.closest('[inert], [hidden], [aria-hidden="true"]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible');
    const stops = candidates.filter(element => {
        if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name)
            return true;
        const group = candidates.filter(candidate => candidate instanceof HTMLInputElement && candidate.type === 'radio' && candidate.name === element.name && candidate.form === element.form);
        return element === (group.find(candidate => candidate.checked) ?? group[0]);
    });
    return stops.map((element, index) => ({ element, index })).sort((a, b) => {
        const first = a.element.tabIndex > 0 ? a.element.tabIndex : Infinity;
        const second = b.element.tabIndex > 0 ? b.element.tabIndex : Infinity;
        return first - second || a.index - b.index;
    }).map(item => item.element);
}
/** Native modal alternative for journeys that do not need Base UI's popup composition. */
export function NativeDialog({ size, trigger, title, description, children, footer, closeLabel = '닫기', open, defaultOpen = false, onOpenChange }) {
    const [localOpen, setLocalOpen] = useState(defaultOpen);
    const currentOpen = open ?? localOpen;
    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    const dialogId = useId();
    const resolvedSize = useHdsSize(size);
    const changeOpen = (next) => {
        if (open === undefined)
            setLocalOpen(next);
        onOpenChange?.(next);
    };
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog)
            return;
        if (currentOpen && !dialog.open) {
            if (!previousFocusRef.current?.isConnected)
                previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            dialog.showModal();
        }
        else if (!currentOpen && dialog.open) {
            dialog.close();
        }
    }, [currentOpen]);
    const originalTrigger = trigger.props;
    const nativeTrigger = cloneElement(trigger, {
        onClick: event => {
            originalTrigger.onClick?.(event);
            if (!event.defaultPrevented) {
                previousFocusRef.current = event.currentTarget;
                changeOpen(true);
            }
        },
        'aria-haspopup': 'dialog',
        'aria-expanded': currentOpen,
        'aria-controls': currentOpen ? dialogId : undefined,
    });
    return _jsxs(SizeContext.Provider, { value: resolvedSize, children: [nativeTrigger, _jsxs("dialog", { ref: dialogRef, id: dialogId, tabIndex: -1, "data-hds-size": resolvedSize, className: "hds-dialog__popup hds-nativeDialog", "aria-labelledby": titleId, "aria-describedby": description ? descriptionId : undefined, onKeyDown: event => {
                    if (event.key !== 'Tab' || event.defaultPrevented)
                        return;
                    const dialog = event.currentTarget;
                    const elements = nativeDialogTabStops(dialog);
                    const current = elements.indexOf(document.activeElement);
                    const reverse = event.shiftKey;
                    if (current < 0 || (reverse ? current === 0 : current === elements.length - 1)) {
                        event.preventDefault();
                        (elements[reverse ? elements.length - 1 : 0] ?? dialog).focus();
                        return;
                    }
                    // With Full Keyboard Access off, WebKit can skip buttons even within
                    // a modal. Focus that next tab stop before the browser moves to body.
                    // Native radio and editing navigation keep their default behavior.
                    const next = elements[current + (reverse ? -1 : 1)];
                    if (next instanceof HTMLButtonElement) {
                        event.preventDefault();
                        next.focus();
                        return;
                    }
                    const from = document.activeElement;
                    requestAnimationFrame(() => {
                        // Safari can move from an inner native select to body when full
                        // keyboard navigation is off. Leave successful middle moves native.
                        if (!dialog.open || dialog.contains(document.activeElement))
                            return;
                        const remaining = nativeDialogTabStops(dialog);
                        const index = remaining.indexOf(from);
                        (remaining[reverse ? Math.max(0, index - 1) : Math.min(remaining.length - 1, index + 1)] ?? dialog).focus();
                    });
                }, onCancel: event => { event.preventDefault(); changeOpen(false); }, onClose: () => {
                    if (currentOpen)
                        changeOpen(false);
                    const previous = previousFocusRef.current;
                    requestAnimationFrame(() => {
                        if (previous?.isConnected && !dialogRef.current?.open && (document.activeElement === document.body || dialogRef.current?.contains(document.activeElement)))
                            previous.focus();
                    });
                }, onClick: event => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom))
                        changeOpen(false);
                }, children: [_jsxs("header", { className: "hds-dialog__header", children: [_jsxs("div", { children: [_jsx("h2", { id: titleId, className: "hds-dialog__title", children: title }), description && _jsx("p", { id: descriptionId, className: "hds-dialog__description", children: description })] }), _jsx("button", { type: "button", className: "hds-dialog__close", "aria-label": closeLabel, onClick: () => changeOpen(false), children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }), children && _jsx("div", { className: "hds-dialog__body", children: children }), footer && _jsx("div", { className: "hds-dialog__footer", children: footer })] })] });
}
export function AlertDialog({ size, trigger, title, description, children, confirmLabel, cancelLabel, onConfirm, onError, pending = false, confirmDisabled = false, open, defaultOpen = false, onOpenChange }) {
    const [localOpen, setLocalOpen] = useState(defaultOpen);
    const [confirming, setConfirming] = useState(false);
    const confirmingRef = useRef(false);
    const busy = pending || confirming;
    const currentOpen = open ?? localOpen;
    const changeOpen = (next) => {
        if (busy && !next)
            return;
        if (open === undefined)
            setLocalOpen(next);
        onOpenChange?.(next);
    };
    const confirm = async () => {
        if (busy || confirmingRef.current || confirmDisabled)
            return;
        confirmingRef.current = true;
        setConfirming(true);
        try {
            await onConfirm();
            if (open === undefined)
                setLocalOpen(false);
            onOpenChange?.(false);
        }
        catch (error) {
            onError?.(error);
        }
        finally {
            confirmingRef.current = false;
            setConfirming(false);
        }
    };
    return _jsx(Sized, { size: size, children: resolved => _jsxs(BaseAlertDialog.Root, { open: currentOpen, onOpenChange: changeOpen, children: [_jsx(BaseAlertDialog.Trigger, { render: trigger }), _jsxs(BaseAlertDialog.Portal, { "data-hds-size": resolved, className: "hds-dialog__portal", children: [_jsx(BaseAlertDialog.Backdrop, { className: "hds-dialog__backdrop" }), _jsxs(BaseAlertDialog.Popup, { className: "hds-dialog__popup hds-alertDialog__popup", "aria-busy": busy || undefined, children: [_jsx(BaseAlertDialog.Title, { className: "hds-dialog__title", children: title }), description && _jsx(BaseAlertDialog.Description, { className: "hds-dialog__description", children: description }), children && _jsx("div", { className: "hds-dialog__body", children: children }), _jsxs("div", { className: "hds-dialog__footer", children: [_jsx(BaseAlertDialog.Close, { type: "button", disabled: busy, className: "hds-overlayButton", children: cancelLabel }), _jsx("button", { type: "button", disabled: busy || confirmDisabled, onClick: confirm, className: "hds-overlayButton hds-overlayButton--danger", children: confirmLabel })] })] })] })] }) });
}
export function Sheet({ trigger, title, description, children, footer, closeLabel = '닫기', side = 'right', size, open, defaultOpen, onOpenChange }) {
    return _jsx(Sized, { size: size, children: resolved => _jsxs(BaseDialog.Root, { open: open, defaultOpen: defaultOpen, onOpenChange: onOpenChange, children: [_jsx(BaseDialog.Trigger, { render: trigger }), _jsxs(BaseDialog.Portal, { "data-hds-size": resolved, className: "hds-dialog__portal", children: [_jsx(BaseDialog.Backdrop, { className: "hds-dialog__backdrop" }), _jsx(BaseDialog.Popup, { className: `hds-dialog__popup hds-sheet__popup hds-sheet__popup--${side} hds-sheet__popup--${resolved}`, children: dialogContent({ title, description, children, footer, closeLabel }) })] })] }) });
}
export function Popover({ size, trigger, title, description, children, closeLabel = '닫기', open, defaultOpen, onOpenChange }) {
    return _jsx(Sized, { size: size, children: resolved => _jsxs(BasePopover.Root, { open: open, defaultOpen: defaultOpen, onOpenChange: onOpenChange, children: [_jsx(BasePopover.Trigger, { render: trigger }), _jsx(BasePopover.Portal, { children: _jsx(BasePopover.Positioner, { sideOffset: 8, align: "start", "data-hds-size": resolved, className: "hds-popover__positioner", children: _jsxs(BasePopover.Popup, { className: "hds-popover__popup", children: [_jsxs("div", { className: "hds-popover__header", children: [_jsx(BasePopover.Title, { className: "hds-dialog__title", children: title }), _jsx(BasePopover.Close, { type: "button", className: "hds-dialog__close", "aria-label": closeLabel, children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }), description && _jsx(BasePopover.Description, { className: "hds-dialog__description", children: description }), children && _jsx("div", { className: "hds-popover__body", children: children })] }) }) })] }) });
}
export function Tooltip({ size, trigger, content, delay }) {
    return _jsx(Sized, { size: size, children: resolved => _jsx(BaseTooltip.Provider, { children: _jsxs(BaseTooltip.Root, { children: [_jsx(BaseTooltip.Trigger, { render: trigger, delay: delay }), _jsx(BaseTooltip.Portal, { children: _jsx(BaseTooltip.Positioner, { sideOffset: 6, "data-hds-size": resolved, className: "hds-tooltip__positioner", children: _jsx(BaseTooltip.Popup, { className: "hds-tooltip__popup", children: content }) }) })] }) }) });
}
function ToastList({ closeLabel }) {
    const { toasts } = BaseToast.useToastManager();
    return toasts.map(toast => _jsx(BaseToast.Root, { toast: toast, className: "hds-toast", swipeDirection: "right", children: _jsxs(BaseToast.Content, { className: "hds-toast__content", children: [_jsxs("div", { className: "hds-toast__text", children: [_jsx(BaseToast.Title, { className: "hds-toast__title" }), _jsx(BaseToast.Description, { className: "hds-toast__description" })] }), _jsx(BaseToast.Close, { type: "button", className: "hds-toast__close", "aria-label": closeLabel, "aria-hidden": false, children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }) }, toast.id));
}
export function ToastProvider({ size, children, viewportLabel = '알림', closeLabel = '알림 닫기', timeout = 5000, limit = 3 }) {
    return _jsx(Sized, { size: size, children: resolved => _jsxs(BaseToast.Provider, { timeout: timeout, limit: limit, children: [children, _jsx(BaseToast.Portal, { children: _jsx(BaseToast.Viewport, { "data-hds-size": resolved, className: "hds-toast__viewport", "aria-label": viewportLabel, children: _jsx(ToastList, { closeLabel: closeLabel }) }) })] }) });
}
export function useToast() {
    const manager = BaseToast.useToastManager();
    return {
        add: message => manager.add({ title: message.title, description: message.description, type: message.tone, timeout: message.timeout }),
        close: id => manager.close(id),
    };
}
