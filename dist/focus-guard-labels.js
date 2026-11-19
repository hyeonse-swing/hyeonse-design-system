'use client';
import { useLayoutEffect } from 'react';
const guardSelector = 'span[data-base-ui-focus-guard]';
const ownedParentSelector = [
    '.hds-field',
    '.hds-field__positioner',
    '.hds-menu__positioner',
    '.hds-menu__popup',
    '.hds-dialog__portal',
    '.hds-popover__positioner',
    '.hds-tooltip__positioner',
].join(', ');
function isHdsGuard(guard) {
    if (guard.parentElement?.matches(ownedParentSelector))
        return true;
    // Only untyped trigger sentinels are adjacent to the marked, open button.
    // An outside sentinel from another popup can touch a closed HDS trigger.
    if (!guard.hasAttribute('data-type'))
        return [guard.previousElementSibling, guard.nextElementSibling]
            .some(sibling => sibling?.matches('[data-hds-focus-trigger][data-popup-open][aria-expanded="true"]'));
    // Base UI places the two outside sentinels on either side of an aria-owns
    // spacer. Resolve its target instead of crossing another popup's guard run.
    if (guard.getAttribute('data-type') !== 'outside')
        return false;
    const spacer = [guard.previousElementSibling, guard.nextElementSibling]
        .find(sibling => sibling?.matches('span[aria-owns]'));
    const target = spacer && document.getElementById(spacer.getAttribute('aria-owns') || '');
    return Boolean(target?.matches('[data-hds-focus-portal]'));
}
function guardLabel(guard) {
    const lang = guard.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang;
    return /^en(?:-|$)/i.test(lang) ? 'Popup focus navigation' : '팝업 초점 이동';
}
const assignedLabels = new WeakMap();
function labelHdsGuards() {
    for (const guard of Array.from(document.querySelectorAll(guardSelector))) {
        // Base UI gives these sentinels a button role only when WebKit VoiceOver
        // needs their focus events. Keep its role, visibility, and focus routing.
        const existing = guard.getAttribute('aria-label');
        const assigned = assignedLabels.get(guard);
        if (guard.getAttribute('role') !== 'button' || guard.hasAttribute('aria-hidden') || !isHdsGuard(guard)) {
            if (assigned && existing === assigned)
                guard.removeAttribute('aria-label');
            assignedLabels.delete(guard);
            continue;
        }
        if (guard.hasAttribute('aria-labelledby')) {
            if (assigned && existing === assigned)
                guard.removeAttribute('aria-label');
            assignedLabels.delete(guard);
            continue;
        }
        if (existing !== null && existing !== assigned) {
            // A caller's own accessible name takes precedence over this fallback.
            assignedLabels.delete(guard);
            continue;
        }
        const next = guardLabel(guard);
        if (existing !== next)
            guard.setAttribute('aria-label', next);
        assignedLabels.set(guard, next);
    }
}
let observers = 0;
let observer = null;
/** Names only the Base UI focus sentinels rendered by HDS components. */
export function useHdsFocusGuardLabels() {
    useLayoutEffect(() => {
        if (typeof MutationObserver === 'undefined')
            return;
        observers++;
        if (observers === 1) {
            observer = new MutationObserver(records => {
                if (records.some(record => record.type === 'childList' || record.target instanceof Element && (record.attributeName === 'lang' || record.target.matches(guardSelector))))
                    labelHdsGuards();
            });
            observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['role', 'aria-hidden', 'aria-label', 'aria-labelledby', 'lang'] });
            labelHdsGuards();
        }
        return () => {
            observers--;
            if (observers === 0) {
                observer?.disconnect();
                observer = null;
            }
        };
    }, []);
}
