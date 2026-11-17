import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { HdsSize } from './sizing.js';
/** Five consistent size steps. Omitted sizes inherit the nearest layout/provider. */
export type Size = HdsSize;
export type SizeProviderProps = {
    size: Size;
    children?: ReactNode;
};
/** Shares size through React portals without adding an element to the page. */
export declare function SizeProvider({ size, children }: SizeProviderProps): import("react").JSX.Element;
type LayoutProps = ComponentPropsWithRef<'div'> & {
    size?: Size;
};
export type StackProps = LayoutProps & {
    gap?: Size;
    align?: 'start' | 'center' | 'end' | 'stretch';
};
export declare function Stack({ size, gap, align, className, style, children, ...props }: StackProps): import("react").JSX.Element;
export type InlineProps = LayoutProps & {
    gap?: Size;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between';
    wrap?: boolean;
};
export declare function Inline({ size, gap, align, justify, wrap, className, children, ...props }: InlineProps): import("react").JSX.Element;
export type GridProps = LayoutProps & {
    gap?: Size;
    columns?: 1 | 2 | 3 | 4;
    minItemWidth?: string;
};
/** Columns collapse with available width; minItemWidth controls the preferred item width. */
export declare function Grid({ size, gap, columns, minItemWidth, style, className, children, ...props }: GridProps): import("react").JSX.Element;
export type ContainerProps = LayoutProps & {
    fluid?: boolean;
};
/** A centered, fluid container capped by its size with scaled horizontal padding. */
export declare function Container({ size, fluid, className, children, ...props }: ContainerProps): import("react").JSX.Element;
export {};
