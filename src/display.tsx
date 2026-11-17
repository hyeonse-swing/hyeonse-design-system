'use client';

import { useState } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { SizeContext, useHdsSize } from './sizing.js';
import type { HdsSize } from './sizing.js';
import { Tabs as BaseTabs, Accordion as BaseAccordion, Collapsible as BaseCollapsible, ToggleGroup as BaseToggleGroup, Toggle as BaseToggle } from '@base-ui/react';

const cn = (base: string, extra?: string) => `${base}${extra ? ` ${extra}` : ''}`;
function Sized({ size, children }: { size?: HdsSize; children: (resolved: HdsSize) => ReactNode }) {
  const resolved = useHdsSize(size);
  return <SizeContext.Provider value={resolved}>{children(resolved)}</SizeContext.Provider>;
}

export type TabsProps = Omit<ComponentPropsWithRef<typeof BaseTabs.Root>, 'className'> & { className?: string; size?: HdsSize };
export function Tabs({ size, className, ...props }: TabsProps) { return <Sized size={size}>{resolved => <BaseTabs.Root {...props} data-hds-size={resolved} className={cn('hds-tabs', className)} />}</Sized>; }
export type TabsListProps = Omit<ComponentPropsWithRef<typeof BaseTabs.List>, 'className'> & { className?: string };
export function TabsList({ className, ...props }: TabsListProps) { return <BaseTabs.List {...props} className={cn('hds-tabs__list', className)} />; }
export type TabsTabProps = Omit<ComponentPropsWithRef<typeof BaseTabs.Tab>, 'className'> & { className?: string };
export function TabsTab({ className, ...props }: TabsTabProps) { return <BaseTabs.Tab {...props} className={cn('hds-tabs__tab', className)} />; }
export type TabsPanelProps = Omit<ComponentPropsWithRef<typeof BaseTabs.Panel>, 'className'> & { className?: string };
export function TabsPanel({ className, ...props }: TabsPanelProps) { return <BaseTabs.Panel {...props} className={cn('hds-tabs__panel', className)} />; }

export type AccordionProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Root>, 'className'> & { className?: string; size?: HdsSize };
export function Accordion({ size, className, ...props }: AccordionProps) { return <Sized size={size}>{resolved => <BaseAccordion.Root {...props} data-hds-size={resolved} className={cn('hds-accordion', className)} />}</Sized>; }
export type AccordionItemProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Item>, 'className'> & { className?: string };
export function AccordionItem({ className, ...props }: AccordionItemProps) { return <BaseAccordion.Item {...props} className={cn('hds-accordion__item', className)} />; }
export type AccordionHeaderProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Header>, 'className'> & { className?: string };
export function AccordionHeader({ className, ...props }: AccordionHeaderProps) { return <BaseAccordion.Header {...props} className={cn('hds-accordion__header', className)} />; }
export type AccordionTriggerProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Trigger>, 'className'> & { className?: string };
export function AccordionTrigger({ className, ...props }: AccordionTriggerProps) { return <BaseAccordion.Trigger {...props} className={cn('hds-accordion__trigger', className)} />; }
export type AccordionPanelProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Panel>, 'className'> & { className?: string };
export function AccordionPanel({ className, ...props }: AccordionPanelProps) { return <BaseAccordion.Panel {...props} className={cn('hds-accordion__panel', className)} />; }

export type CollapsibleProps = Omit<ComponentPropsWithRef<typeof BaseCollapsible.Root>, 'className'> & { className?: string; size?: HdsSize };
export function Collapsible({ size, className, ...props }: CollapsibleProps) { return <Sized size={size}>{resolved => <BaseCollapsible.Root {...props} data-hds-size={resolved} className={cn('hds-collapsible', className)} />}</Sized>; }
export type CollapsibleTriggerProps = Omit<ComponentPropsWithRef<typeof BaseCollapsible.Trigger>, 'className'> & { className?: string };
export function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) { return <BaseCollapsible.Trigger {...props} className={cn('hds-collapsible__trigger', className)} />; }
export type CollapsiblePanelProps = Omit<ComponentPropsWithRef<typeof BaseCollapsible.Panel>, 'className'> & { className?: string };
export function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps) { return <BaseCollapsible.Panel {...props} className={cn('hds-collapsible__panel', className)} />; }

export type BreadcrumbItem = { label: ReactNode; href?: string };
export type BreadcrumbProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & { items: readonly BreadcrumbItem[]; separator?: ReactNode; size?: HdsSize };
export function Breadcrumb({ size, items, separator = '/', className, 'aria-label': ariaLabel = '경로', ref, ...props }: BreadcrumbProps) {
  return <Sized size={size}>{resolved => <nav {...props} ref={ref} aria-label={ariaLabel} data-hds-size={resolved} className={cn('hds-breadcrumb', className)}><ol>{items.map((item, index) => <li key={index}>{index > 0 && <span aria-hidden="true" className="hds-breadcrumb__separator">{separator}</span>}{index === items.length - 1 ? <span aria-current="page">{item.label}</span> : item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}</li>)}</ol></nav>}</Sized>;
}
export type PaginationProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & { page: number; pageCount: number; onPageChange: (page: number) => void; locale?: 'ko' | 'en'; siblingCount?: number; size?: HdsSize };
export function Pagination({ size, page, pageCount, onPageChange, locale = 'ko', siblingCount = 1, className, 'aria-label': ariaLabel, ref, ...props }: PaginationProps) {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || !Number.isSafeInteger(page) || page < 1 || page > pageCount || !Number.isSafeInteger(siblingCount) || siblingCount < 0) throw new RangeError('Pagination requires a valid page, pageCount, and siblingCount.');
  const words = locale === 'ko' ? { nav: '페이지 이동', prev: '이전 페이지', next: '다음 페이지', page: '페이지' } : { nav: 'Pagination', prev: 'Previous page', next: 'Next page', page: 'Page' };
  const visible = new Set([1, pageCount]);
  for (let n = Math.max(1, page - siblingCount); n <= Math.min(pageCount, page + siblingCount); n++) visible.add(n);
  const numbers = [...visible].sort((a, b) => a - b);
  return <Sized size={size}>{resolved => <nav {...props} ref={ref} aria-label={ariaLabel ?? words.nav} data-hds-size={resolved} className={cn('hds-pagination', className)}><button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label={words.prev}><span aria-hidden="true">‹</span></button>{numbers.flatMap((n, i) => [i && n - numbers[i - 1] > 1 ? <span key={`gap-${n}`} aria-hidden="true">…</span> : null, <button key={n} type="button" aria-label={`${words.page} ${n}`} aria-current={n === page ? 'page' : undefined} onClick={() => onPageChange(n)}>{n}</button>])}<button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label={words.next}><span aria-hidden="true">›</span></button></nav>}</Sized>;
}
export type StepperItem = { label: ReactNode; description?: ReactNode };
export type StepperProps = Omit<ComponentPropsWithRef<'ol'>, 'children'> & { steps: readonly StepperItem[]; currentStep: number; size?: HdsSize };
export function Stepper({ size, steps, currentStep, className, ref, ...props }: StepperProps) {
  if (!Number.isSafeInteger(currentStep) || currentStep < 1 || currentStep > steps.length) throw new RangeError('Stepper requires a current step within steps.');
  return <Sized size={size}>{resolved => <ol {...props} ref={ref} data-hds-size={resolved} className={cn('hds-stepper', className)}>{steps.map((step, i) => <li key={i} data-status={i + 1 < currentStep ? 'complete' : i + 1 === currentStep ? 'current' : 'upcoming'} aria-current={i + 1 === currentStep ? 'step' : undefined}><span className="hds-stepper__number" aria-hidden="true">{i + 1}</span><span>{step.label}{step.description && <small>{step.description}</small>}</span></li>)}</ol>}</Sized>;
}
export type SegmentedControlProps = Omit<ComponentPropsWithRef<typeof BaseToggleGroup>, 'className'> & { className?: string; size?: HdsSize };
export function SegmentedControl({ size, className, multiple = false, ...props }: SegmentedControlProps) { return <Sized size={size}>{resolved => <BaseToggleGroup {...props} multiple={multiple} data-hds-size={resolved} className={cn('hds-segmented', className)} />}</Sized>; }
export type ToggleProps = Omit<ComponentPropsWithRef<typeof BaseToggle>, 'className'> & { className?: string; size?: HdsSize };
export function Toggle({ size, className, ...props }: ToggleProps) { return <Sized size={size}>{resolved => <BaseToggle {...props} data-hds-size={resolved} className={cn('hds-toggle', className)} />}</Sized>; }

export type CardProps = Omit<ComponentPropsWithRef<'article'>, 'title'> & { title?: ReactNode; description?: ReactNode; footer?: ReactNode; size?: HdsSize };
export function Card({ size, title, description, footer, children, className, ref, ...props }: CardProps) { return <Sized size={size}>{resolved => <article {...props} ref={ref} data-hds-size={resolved} className={cn('hds-card', className)}>{title && <h3>{title}</h3>}{description && <p>{description}</p>}{children}{footer && <footer>{footer}</footer>}</article>}</Sized>; }
export type TableProps = ComponentPropsWithRef<'table'> & { containerClassName?: string; scrollLabel?: string; size?: HdsSize };
export function Table({ size, containerClassName, scrollLabel = '표 스크롤 영역', className, ref, ...props }: TableProps) { return <Sized size={size}>{resolved => <div data-hds-size={resolved} className={cn('hds-tableScroll', containerClassName)} tabIndex={0} role="region" aria-label={scrollLabel}><table {...props} ref={ref} className={cn('hds-table', className)} /></div>}</Sized>; }
export type TableHeaderProps = ComponentPropsWithRef<'thead'> & { className?: string };
export function TableHeader({ className, ...props }: TableHeaderProps) { return <thead {...props} className={cn('hds-table__header', className)} />; }
export type TableBodyProps = ComponentPropsWithRef<'tbody'> & { className?: string };
export function TableBody({ className, ...props }: TableBodyProps) { return <tbody {...props} className={cn('hds-table__body', className)} />; }
export type TableRowProps = ComponentPropsWithRef<'tr'> & { className?: string };
export function TableRow({ className, ...props }: TableRowProps) { return <tr {...props} className={cn('hds-table__row', className)} />; }
export type TableHeadProps = ComponentPropsWithRef<'th'> & { className?: string };
export function TableHead({ className, scope = 'col', ...props }: TableHeadProps) { return <th {...props} scope={scope} className={cn('hds-table__head', className)} />; }
export type TableCellProps = ComponentPropsWithRef<'td'> & { className?: string };
export function TableCell({ className, ...props }: TableCellProps) { return <td {...props} className={cn('hds-table__cell', className)} />; }
export type TableCaptionProps = ComponentPropsWithRef<'caption'> & { className?: string };
export function TableCaption({ className, ...props }: TableCaptionProps) { return <caption {...props} className={cn('hds-table__caption', className)} />; }
export type AlertProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & { tone?: 'info' | 'success' | 'warning' | 'danger'; title?: ReactNode; size?: HdsSize };
export function Alert({ size, tone = 'info', title, children, className, role, ref, ...props }: AlertProps) { return <Sized size={size}>{resolved => <div {...props} ref={ref} role={role ?? (tone === 'danger' ? 'alert' : 'status')} data-hds-size={resolved} className={cn(`hds-alert hds-alert--${tone}`, className)}>{title && <strong>{title}</strong>}{children}</div>}</Sized>; }
export type AvatarProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & { src?: string; alt: string; fallback: ReactNode; size?: HdsSize };
function AvatarContent({ src, alt, fallback }: Pick<AvatarProps, 'src' | 'alt' | 'fallback'>) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt={alt} onError={() => setFailed(true)} /> : <span role="img" aria-label={alt}>{fallback}</span>;
}
export function Avatar({ src, alt, fallback, size, className, ref, ...props }: AvatarProps) { return <Sized size={size}>{resolved => <span {...props} ref={ref} data-hds-size={resolved} className={cn(`hds-avatar hds-avatar--${resolved}`, className)}><AvatarContent key={src} src={src} alt={alt} fallback={fallback} /></span>}</Sized>; }
export type SeparatorProps = ComponentPropsWithRef<'hr'> & { decorative?: boolean; size?: HdsSize };
export function Separator({ size, decorative = true, className, ref, ...props }: SeparatorProps) { return <Sized size={size}>{resolved => <hr {...props} ref={ref} aria-hidden={decorative || undefined} data-hds-size={resolved} className={cn('hds-separator', className)} />}</Sized>; }
export type SkeletonProps = ComponentPropsWithRef<'span'> & { width?: string | number; height?: string | number; size?: HdsSize };
export function Skeleton({ size, width, height, style, className, ref, ...props }: SkeletonProps) { return <Sized size={size}>{resolved => <span {...props} ref={ref} aria-hidden="true" data-hds-size={resolved} className={cn('hds-skeleton', className)} style={{ ...style, width, height }} />}</Sized>; }
export type SpinnerProps = ComponentPropsWithRef<'span'> & { label?: string; size?: HdsSize };
export function Spinner({ size, label = '불러오는 중', className, ref, ...props }: SpinnerProps) { return <Sized size={size}>{resolved => <span {...props} ref={ref} role="status" aria-label={label} data-hds-size={resolved} className={cn('hds-spinner', className)} />}</Sized>; }
export type ProgressProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & { value?: number; max?: number; label: string; size?: HdsSize };
export function Progress({ size, value, max = 100, label, className, ref, ...props }: ProgressProps) {
  if (!Number.isFinite(max) || max <= 0 || (value !== undefined && !Number.isFinite(value))) throw new RangeError('Progress requires a positive finite max and finite value.');
  const actual = value === undefined ? undefined : Math.max(0, Math.min(max, value));
  return <Sized size={size}>{resolved => <div {...props} ref={ref} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={actual} data-hds-size={resolved} className={cn('hds-progress', className)}><span style={{ width: actual === undefined ? undefined : `${actual / max * 100}%` }} /></div>}</Sized>;
}
export type EmptyStateProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & { title: ReactNode; description?: ReactNode; action?: ReactNode; size?: HdsSize };
export function EmptyState({ size, title, description, action, className, ref, ...props }: EmptyStateProps) { return <Sized size={size}>{resolved => <div {...props} ref={ref} data-hds-size={resolved} className={cn('hds-emptyState', className)}><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>}</Sized>; }
export type AspectRatioProps = ComponentPropsWithRef<'div'> & { ratio?: number; size?: HdsSize };
export function AspectRatio({ size, ratio = 16 / 9, style, className, ref, ...props }: AspectRatioProps) { if (!Number.isFinite(ratio) || ratio <= 0) throw new RangeError('AspectRatio requires a positive finite ratio.'); return <Sized size={size}>{resolved => <div {...props} ref={ref} data-hds-size={resolved} className={cn('hds-aspectRatio', className)} style={{ aspectRatio: String(ratio), ...style }} />}</Sized>; }
export type ScrollAreaProps = ComponentPropsWithRef<'div'> & { maxHeight?: string | number; label: string; size?: HdsSize };
export function ScrollArea({ size, maxHeight, label, style, className, ref, ...props }: ScrollAreaProps) { return <Sized size={size}>{resolved => <div {...props} ref={ref} tabIndex={0} role="region" aria-label={label} data-hds-size={resolved} className={cn('hds-scrollArea', className)} style={{ maxHeight, ...style }} />}</Sized>; }
export type LabelProps = ComponentPropsWithRef<'label'> & { required?: boolean; size?: HdsSize };
export function Label({ size, required, children, className, ref, ...props }: LabelProps) { return <Sized size={size}>{resolved => <label {...props} ref={ref} data-hds-size={resolved} className={cn('hds-label', className)}>{children}{required && <span aria-hidden="true"> *</span>}</label>}</Sized>; }
export type VisuallyHiddenProps = ComponentPropsWithRef<'span'> & { className?: string };
export function VisuallyHidden({ className, ref, ...props }: VisuallyHiddenProps) { return <span {...props} ref={ref} className={cn('hds-visuallyHidden', className)} />; }
