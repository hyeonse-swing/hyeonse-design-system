'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { SizeContext, useHdsSize } from './sizing.js';
import { Tabs as BaseTabs, Accordion as BaseAccordion, Collapsible as BaseCollapsible, ToggleGroup as BaseToggleGroup, Toggle as BaseToggle } from '@base-ui/react';
const cn = (base, extra) => `${base}${extra ? ` ${extra}` : ''}`;
function Sized({ size, children }) {
    const resolved = useHdsSize(size);
    return _jsx(SizeContext.Provider, { value: resolved, children: children(resolved) });
}
export function Tabs({ size, className, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx(BaseTabs.Root, { ...props, "data-hds-size": resolved, className: cn('hds-tabs', className) }) }); }
export function TabsList({ className, ...props }) { return _jsx(BaseTabs.List, { ...props, className: cn('hds-tabs__list', className) }); }
export function TabsTab({ className, ...props }) { return _jsx(BaseTabs.Tab, { ...props, className: cn('hds-tabs__tab', className) }); }
export function TabsPanel({ className, ...props }) { return _jsx(BaseTabs.Panel, { ...props, className: cn('hds-tabs__panel', className) }); }
export function Accordion({ size, className, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx(BaseAccordion.Root, { ...props, "data-hds-size": resolved, className: cn('hds-accordion', className) }) }); }
export function AccordionItem({ className, ...props }) { return _jsx(BaseAccordion.Item, { ...props, className: cn('hds-accordion__item', className) }); }
export function AccordionHeader({ className, ...props }) { return _jsx(BaseAccordion.Header, { ...props, className: cn('hds-accordion__header', className) }); }
export function AccordionTrigger({ className, ...props }) { return _jsx(BaseAccordion.Trigger, { ...props, className: cn('hds-accordion__trigger', className) }); }
export function AccordionPanel({ className, ...props }) { return _jsx(BaseAccordion.Panel, { ...props, className: cn('hds-accordion__panel', className) }); }
export function Collapsible({ size, className, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx(BaseCollapsible.Root, { ...props, "data-hds-size": resolved, className: cn('hds-collapsible', className) }) }); }
export function CollapsibleTrigger({ className, ...props }) { return _jsx(BaseCollapsible.Trigger, { ...props, className: cn('hds-collapsible__trigger', className) }); }
export function CollapsiblePanel({ className, ...props }) { return _jsx(BaseCollapsible.Panel, { ...props, className: cn('hds-collapsible__panel', className) }); }
export function Breadcrumb({ size, items, separator = '/', className, 'aria-label': ariaLabel = '경로', ref, ...props }) {
    return _jsx(Sized, { size: size, children: resolved => _jsx("nav", { ...props, ref: ref, "aria-label": ariaLabel, "data-hds-size": resolved, className: cn('hds-breadcrumb', className), children: _jsx("ol", { children: items.map((item, index) => _jsxs("li", { children: [index > 0 && _jsx("span", { "aria-hidden": "true", className: "hds-breadcrumb__separator", children: separator }), index === items.length - 1 ? _jsx("span", { "aria-current": "page", children: item.label }) : item.href ? _jsx("a", { href: item.href, children: item.label }) : _jsx("span", { children: item.label })] }, index)) }) }) });
}
export function Pagination({ size, page, pageCount, onPageChange, locale = 'ko', siblingCount = 1, className, 'aria-label': ariaLabel, ref, ...props }) {
    if (!Number.isSafeInteger(pageCount) || pageCount < 1 || !Number.isSafeInteger(page) || page < 1 || page > pageCount || !Number.isSafeInteger(siblingCount) || siblingCount < 0)
        throw new RangeError('Pagination requires a valid page, pageCount, and siblingCount.');
    const words = locale === 'ko' ? { nav: '페이지 이동', prev: '이전 페이지', next: '다음 페이지', page: '페이지' } : { nav: 'Pagination', prev: 'Previous page', next: 'Next page', page: 'Page' };
    const visible = new Set([1, pageCount]);
    for (let n = Math.max(1, page - siblingCount); n <= Math.min(pageCount, page + siblingCount); n++)
        visible.add(n);
    const numbers = [...visible].sort((a, b) => a - b);
    return _jsx(Sized, { size: size, children: resolved => _jsxs("nav", { ...props, ref: ref, "aria-label": ariaLabel ?? words.nav, "data-hds-size": resolved, className: cn('hds-pagination', className), children: [_jsx("button", { type: "button", disabled: page === 1, onClick: () => onPageChange(page - 1), "aria-label": words.prev, children: _jsx("span", { "aria-hidden": "true", children: "\u2039" }) }), numbers.flatMap((n, i) => [i && n - numbers[i - 1] > 1 ? _jsx("span", { "aria-hidden": "true", children: "\u2026" }, `gap-${n}`) : null, _jsx("button", { type: "button", "aria-label": `${words.page} ${n}`, "aria-current": n === page ? 'page' : undefined, onClick: () => onPageChange(n), children: n }, n)]), _jsx("button", { type: "button", disabled: page === pageCount, onClick: () => onPageChange(page + 1), "aria-label": words.next, children: _jsx("span", { "aria-hidden": "true", children: "\u203A" }) })] }) });
}
export function Stepper({ size, steps, currentStep, className, ref, ...props }) {
    if (!Number.isSafeInteger(currentStep) || currentStep < 1 || currentStep > steps.length)
        throw new RangeError('Stepper requires a current step within steps.');
    return _jsx(Sized, { size: size, children: resolved => _jsx("ol", { ...props, ref: ref, "data-hds-size": resolved, className: cn('hds-stepper', className), children: steps.map((step, i) => _jsxs("li", { "data-status": i + 1 < currentStep ? 'complete' : i + 1 === currentStep ? 'current' : 'upcoming', "aria-current": i + 1 === currentStep ? 'step' : undefined, children: [_jsx("span", { className: "hds-stepper__number", "aria-hidden": "true", children: i + 1 }), _jsxs("span", { children: [step.label, step.description && _jsx("small", { children: step.description })] })] }, i)) }) });
}
export function SegmentedControl({ size, className, multiple = false, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx(BaseToggleGroup, { ...props, multiple: multiple, "data-hds-size": resolved, className: cn('hds-segmented', className) }) }); }
export function Toggle({ size, className, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx(BaseToggle, { ...props, "data-hds-size": resolved, className: cn('hds-toggle', className) }) }); }
export function Card({ size, title, description, footer, children, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsxs("article", { ...props, ref: ref, "data-hds-size": resolved, className: cn('hds-card', className), children: [title && _jsx("h3", { children: title }), description && _jsx("p", { children: description }), children, footer && _jsx("footer", { children: footer })] }) }); }
export function Table({ size, containerClassName, scrollLabel = '표 스크롤 영역', className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx("div", { "data-hds-size": resolved, className: cn('hds-tableScroll', containerClassName), tabIndex: 0, role: "region", "aria-label": scrollLabel, children: _jsx("table", { ...props, ref: ref, className: cn('hds-table', className) }) }) }); }
export function TableHeader({ className, ...props }) { return _jsx("thead", { ...props, className: cn('hds-table__header', className) }); }
export function TableBody({ className, ...props }) { return _jsx("tbody", { ...props, className: cn('hds-table__body', className) }); }
export function TableRow({ className, ...props }) { return _jsx("tr", { ...props, className: cn('hds-table__row', className) }); }
export function TableHead({ className, scope = 'col', ...props }) { return _jsx("th", { ...props, scope: scope, className: cn('hds-table__head', className) }); }
export function TableCell({ className, ...props }) { return _jsx("td", { ...props, className: cn('hds-table__cell', className) }); }
export function TableCaption({ className, ...props }) { return _jsx("caption", { ...props, className: cn('hds-table__caption', className) }); }
export function Alert({ size, tone = 'info', title, children, className, role, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsxs("div", { ...props, ref: ref, role: role ?? (tone === 'danger' ? 'alert' : 'status'), "data-hds-size": resolved, className: cn(`hds-alert hds-alert--${tone}`, className), children: [title && _jsx("strong", { children: title }), children] }) }); }
function AvatarContent({ src, alt, fallback }) {
    const [failed, setFailed] = useState(false);
    return src && !failed ? _jsx("img", { src: src, alt: alt, onError: () => setFailed(true) }) : _jsx("span", { role: "img", "aria-label": alt, children: fallback });
}
export function Avatar({ src, alt, fallback, size, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx("span", { ...props, ref: ref, "data-hds-size": resolved, className: cn(`hds-avatar hds-avatar--${resolved}`, className), children: _jsx(AvatarContent, { src: src, alt: alt, fallback: fallback }, src) }) }); }
export function Separator({ size, decorative = true, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx("hr", { ...props, ref: ref, "aria-hidden": decorative || undefined, "data-hds-size": resolved, className: cn('hds-separator', className) }) }); }
export function Skeleton({ size, width, height, style, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx("span", { ...props, ref: ref, "aria-hidden": "true", "data-hds-size": resolved, className: cn('hds-skeleton', className), style: { ...style, width, height } }) }); }
export function Spinner({ size, label = '불러오는 중', className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx("span", { ...props, ref: ref, role: "status", "aria-label": label, "data-hds-size": resolved, className: cn('hds-spinner', className) }) }); }
export function Progress({ size, value, max = 100, label, className, ref, ...props }) {
    if (!Number.isFinite(max) || max <= 0 || (value !== undefined && !Number.isFinite(value)))
        throw new RangeError('Progress requires a positive finite max and finite value.');
    const actual = value === undefined ? undefined : Math.max(0, Math.min(max, value));
    return _jsx(Sized, { size: size, children: resolved => _jsx("div", { ...props, ref: ref, role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": actual, "data-hds-size": resolved, className: cn('hds-progress', className), children: _jsx("span", { style: { width: actual === undefined ? undefined : `${actual / max * 100}%` } }) }) });
}
export function EmptyState({ size, title, description, action, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsxs("div", { ...props, ref: ref, "data-hds-size": resolved, className: cn('hds-emptyState', className), children: [_jsx("h3", { children: title }), description && _jsx("p", { children: description }), action] }) }); }
export function AspectRatio({ size, ratio = 16 / 9, style, className, ref, ...props }) { if (!Number.isFinite(ratio) || ratio <= 0)
    throw new RangeError('AspectRatio requires a positive finite ratio.'); return _jsx(Sized, { size: size, children: resolved => _jsx("div", { ...props, ref: ref, "data-hds-size": resolved, className: cn('hds-aspectRatio', className), style: { aspectRatio: String(ratio), ...style } }) }); }
export function ScrollArea({ size, maxHeight, label, style, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsx("div", { ...props, ref: ref, tabIndex: 0, role: "region", "aria-label": label, "data-hds-size": resolved, className: cn('hds-scrollArea', className), style: { maxHeight, ...style } }) }); }
export function Label({ size, required, children, className, ref, ...props }) { return _jsx(Sized, { size: size, children: resolved => _jsxs("label", { ...props, ref: ref, "data-hds-size": resolved, className: cn('hds-label', className), children: [children, required && _jsx("span", { "aria-hidden": "true", children: " *" })] }) }); }
export function VisuallyHidden({ className, ref, ...props }) { return _jsx("span", { ...props, ref: ref, className: cn('hds-visuallyHidden', className) }); }
