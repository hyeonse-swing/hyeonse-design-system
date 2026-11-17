import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { HdsSize } from './sizing.js';
import { Tabs as BaseTabs, Accordion as BaseAccordion, Collapsible as BaseCollapsible, ToggleGroup as BaseToggleGroup, Toggle as BaseToggle } from '@base-ui/react';
export type TabsProps = Omit<ComponentPropsWithRef<typeof BaseTabs.Root>, 'className'> & {
    className?: string;
    size?: HdsSize;
};
export declare function Tabs({ size, className, ...props }: TabsProps): import("react").JSX.Element;
export type TabsListProps = Omit<ComponentPropsWithRef<typeof BaseTabs.List>, 'className'> & {
    className?: string;
};
export declare function TabsList({ className, ...props }: TabsListProps): import("react").JSX.Element;
export type TabsTabProps = Omit<ComponentPropsWithRef<typeof BaseTabs.Tab>, 'className'> & {
    className?: string;
};
export declare function TabsTab({ className, ...props }: TabsTabProps): import("react").JSX.Element;
export type TabsPanelProps = Omit<ComponentPropsWithRef<typeof BaseTabs.Panel>, 'className'> & {
    className?: string;
};
export declare function TabsPanel({ className, ...props }: TabsPanelProps): import("react").JSX.Element;
export type AccordionProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Root>, 'className'> & {
    className?: string;
    size?: HdsSize;
};
export declare function Accordion({ size, className, ...props }: AccordionProps): import("react").JSX.Element;
export type AccordionItemProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Item>, 'className'> & {
    className?: string;
};
export declare function AccordionItem({ className, ...props }: AccordionItemProps): import("react").JSX.Element;
export type AccordionHeaderProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Header>, 'className'> & {
    className?: string;
};
export declare function AccordionHeader({ className, ...props }: AccordionHeaderProps): import("react").JSX.Element;
export type AccordionTriggerProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Trigger>, 'className'> & {
    className?: string;
};
export declare function AccordionTrigger({ className, ...props }: AccordionTriggerProps): import("react").JSX.Element;
export type AccordionPanelProps = Omit<ComponentPropsWithRef<typeof BaseAccordion.Panel>, 'className'> & {
    className?: string;
};
export declare function AccordionPanel({ className, ...props }: AccordionPanelProps): import("react").JSX.Element;
export type CollapsibleProps = Omit<ComponentPropsWithRef<typeof BaseCollapsible.Root>, 'className'> & {
    className?: string;
    size?: HdsSize;
};
export declare function Collapsible({ size, className, ...props }: CollapsibleProps): import("react").JSX.Element;
export type CollapsibleTriggerProps = Omit<ComponentPropsWithRef<typeof BaseCollapsible.Trigger>, 'className'> & {
    className?: string;
};
export declare function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps): import("react").JSX.Element;
export type CollapsiblePanelProps = Omit<ComponentPropsWithRef<typeof BaseCollapsible.Panel>, 'className'> & {
    className?: string;
};
export declare function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps): import("react").JSX.Element;
export type BreadcrumbItem = {
    label: ReactNode;
    href?: string;
};
export type BreadcrumbProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & {
    items: readonly BreadcrumbItem[];
    separator?: ReactNode;
    size?: HdsSize;
};
export declare function Breadcrumb({ size, items, separator, className, 'aria-label': ariaLabel, ref, ...props }: BreadcrumbProps): import("react").JSX.Element;
export type PaginationProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    locale?: 'ko' | 'en';
    siblingCount?: number;
    size?: HdsSize;
};
export declare function Pagination({ size, page, pageCount, onPageChange, locale, siblingCount, className, 'aria-label': ariaLabel, ref, ...props }: PaginationProps): import("react").JSX.Element;
export type StepperItem = {
    label: ReactNode;
    description?: ReactNode;
};
export type StepperProps = Omit<ComponentPropsWithRef<'ol'>, 'children'> & {
    steps: readonly StepperItem[];
    currentStep: number;
    size?: HdsSize;
};
export declare function Stepper({ size, steps, currentStep, className, ref, ...props }: StepperProps): import("react").JSX.Element;
export type SegmentedControlProps = Omit<ComponentPropsWithRef<typeof BaseToggleGroup>, 'className'> & {
    className?: string;
    size?: HdsSize;
};
export declare function SegmentedControl({ size, className, multiple, ...props }: SegmentedControlProps): import("react").JSX.Element;
export type ToggleProps = Omit<ComponentPropsWithRef<typeof BaseToggle>, 'className'> & {
    className?: string;
    size?: HdsSize;
};
export declare function Toggle({ size, className, ...props }: ToggleProps): import("react").JSX.Element;
export type CardProps = Omit<ComponentPropsWithRef<'article'>, 'title'> & {
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    size?: HdsSize;
};
export declare function Card({ size, title, description, footer, children, className, ref, ...props }: CardProps): import("react").JSX.Element;
export type TableProps = ComponentPropsWithRef<'table'> & {
    containerClassName?: string;
    scrollLabel?: string;
    size?: HdsSize;
};
export declare function Table({ size, containerClassName, scrollLabel, className, ref, ...props }: TableProps): import("react").JSX.Element;
export type TableHeaderProps = ComponentPropsWithRef<'thead'> & {
    className?: string;
};
export declare function TableHeader({ className, ...props }: TableHeaderProps): import("react").JSX.Element;
export type TableBodyProps = ComponentPropsWithRef<'tbody'> & {
    className?: string;
};
export declare function TableBody({ className, ...props }: TableBodyProps): import("react").JSX.Element;
export type TableRowProps = ComponentPropsWithRef<'tr'> & {
    className?: string;
};
export declare function TableRow({ className, ...props }: TableRowProps): import("react").JSX.Element;
export type TableHeadProps = ComponentPropsWithRef<'th'> & {
    className?: string;
};
export declare function TableHead({ className, scope, ...props }: TableHeadProps): import("react").JSX.Element;
export type TableCellProps = ComponentPropsWithRef<'td'> & {
    className?: string;
};
export declare function TableCell({ className, ...props }: TableCellProps): import("react").JSX.Element;
export type TableCaptionProps = ComponentPropsWithRef<'caption'> & {
    className?: string;
};
export declare function TableCaption({ className, ...props }: TableCaptionProps): import("react").JSX.Element;
export type AlertProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
    tone?: 'info' | 'success' | 'warning' | 'danger';
    title?: ReactNode;
    size?: HdsSize;
};
export declare function Alert({ size, tone, title, children, className, role, ref, ...props }: AlertProps): import("react").JSX.Element;
export type AvatarProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
    src?: string;
    alt: string;
    fallback: ReactNode;
    size?: HdsSize;
};
export declare function Avatar({ src, alt, fallback, size, className, ref, ...props }: AvatarProps): import("react").JSX.Element;
export type SeparatorProps = ComponentPropsWithRef<'hr'> & {
    decorative?: boolean;
    size?: HdsSize;
};
export declare function Separator({ size, decorative, className, ref, ...props }: SeparatorProps): import("react").JSX.Element;
export type SkeletonProps = ComponentPropsWithRef<'span'> & {
    width?: string | number;
    height?: string | number;
    size?: HdsSize;
};
export declare function Skeleton({ size, width, height, style, className, ref, ...props }: SkeletonProps): import("react").JSX.Element;
export type SpinnerProps = ComponentPropsWithRef<'span'> & {
    label?: string;
    size?: HdsSize;
};
export declare function Spinner({ size, label, className, ref, ...props }: SpinnerProps): import("react").JSX.Element;
export type ProgressProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
    value?: number;
    max?: number;
    label: string;
    size?: HdsSize;
};
export declare function Progress({ size, value, max, label, className, ref, ...props }: ProgressProps): import("react").JSX.Element;
export type EmptyStateProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    size?: HdsSize;
};
export declare function EmptyState({ size, title, description, action, className, ref, ...props }: EmptyStateProps): import("react").JSX.Element;
export type AspectRatioProps = ComponentPropsWithRef<'div'> & {
    ratio?: number;
    size?: HdsSize;
};
export declare function AspectRatio({ size, ratio, style, className, ref, ...props }: AspectRatioProps): import("react").JSX.Element;
export type ScrollAreaProps = ComponentPropsWithRef<'div'> & {
    maxHeight?: string | number;
    label: string;
    size?: HdsSize;
};
export declare function ScrollArea({ size, maxHeight, label, style, className, ref, ...props }: ScrollAreaProps): import("react").JSX.Element;
export type LabelProps = ComponentPropsWithRef<'label'> & {
    required?: boolean;
    size?: HdsSize;
};
export declare function Label({ size, required, children, className, ref, ...props }: LabelProps): import("react").JSX.Element;
export type VisuallyHiddenProps = ComponentPropsWithRef<'span'> & {
    className?: string;
};
export declare function VisuallyHidden({ className, ref, ...props }: VisuallyHiddenProps): import("react").JSX.Element;
