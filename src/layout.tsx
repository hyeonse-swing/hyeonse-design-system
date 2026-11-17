'use client';

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import { SizeContext, useHdsSize } from './sizing.js';
import type { HdsSize } from './sizing.js';

/** Five consistent size steps. Omitted sizes inherit the nearest layout/provider. */
export type Size = HdsSize;
export type SizeProviderProps = { size: Size; children?: ReactNode };
/** Shares size through React portals without adding an element to the page. */
export function SizeProvider({ size, children }: SizeProviderProps) {
  return <SizeContext.Provider value={size}>{children}</SizeContext.Provider>;
}

type LayoutProps = ComponentPropsWithRef<'div'> & { size?: Size };
export type StackProps = LayoutProps & { gap?: Size; align?: 'start' | 'center' | 'end' | 'stretch' };
export function Stack({ size, gap, align = 'stretch', className, style, children, ...props }: StackProps) {
  const resolved = useHdsSize(size);
  return <SizeContext.Provider value={resolved}><div {...props} data-hds-size={resolved} data-hds-gap={gap} data-align={align} className={`hds-stack${className ? ` ${className}` : ''}`} style={style}>{children}</div></SizeContext.Provider>;
}

export type InlineProps = LayoutProps & { gap?: Size; align?: 'start' | 'center' | 'end' | 'stretch'; justify?: 'start' | 'center' | 'end' | 'between'; wrap?: boolean };
export function Inline({ size, gap, align = 'center', justify = 'start', wrap = true, className, children, ...props }: InlineProps) {
  const resolved = useHdsSize(size);
  return <SizeContext.Provider value={resolved}><div {...props} data-hds-size={resolved} data-hds-gap={gap} data-align={align} data-justify={justify} data-wrap={wrap} className={`hds-inline${className ? ` ${className}` : ''}`}>{children}</div></SizeContext.Provider>;
}

export type GridProps = LayoutProps & { gap?: Size; columns?: 1 | 2 | 3 | 4; minItemWidth?: string };
/** Columns collapse with available width; minItemWidth controls the preferred item width. */
export function Grid({ size, gap, columns = 2, minItemWidth = '14rem', style, className, children, ...props }: GridProps) {
  const resolved = useHdsSize(size);
  return <SizeContext.Provider value={resolved}><div {...props} data-hds-size={resolved} data-hds-gap={gap} className={`hds-grid${className ? ` ${className}` : ''}`} style={{ '--hds-grid-columns': columns, '--hds-grid-min': minItemWidth, ...style } as CSSProperties}>{children}</div></SizeContext.Provider>;
}

export type ContainerProps = LayoutProps & { fluid?: boolean };
/** A centered, fluid container capped by its size with scaled horizontal padding. */
export function Container({ size, fluid = false, className, children, ...props }: ContainerProps) {
  const resolved = useHdsSize(size);
  return <SizeContext.Provider value={resolved}><div {...props} data-hds-size={resolved} data-fluid={fluid} className={`hds-container${className ? ` ${className}` : ''}`}>{children}</div></SizeContext.Provider>;
}
