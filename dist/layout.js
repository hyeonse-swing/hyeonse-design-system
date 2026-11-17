'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { SizeContext, useHdsSize } from './sizing.js';
/** Shares size through React portals without adding an element to the page. */
export function SizeProvider({ size, children }) {
    return _jsx(SizeContext.Provider, { value: size, children: children });
}
export function Stack({ size, gap, align = 'stretch', className, style, children, ...props }) {
    const resolved = useHdsSize(size);
    return _jsx(SizeContext.Provider, { value: resolved, children: _jsx("div", { ...props, "data-hds-size": resolved, "data-hds-gap": gap, "data-align": align, className: `hds-stack${className ? ` ${className}` : ''}`, style: style, children: children }) });
}
export function Inline({ size, gap, align = 'center', justify = 'start', wrap = true, className, children, ...props }) {
    const resolved = useHdsSize(size);
    return _jsx(SizeContext.Provider, { value: resolved, children: _jsx("div", { ...props, "data-hds-size": resolved, "data-hds-gap": gap, "data-align": align, "data-justify": justify, "data-wrap": wrap, className: `hds-inline${className ? ` ${className}` : ''}`, children: children }) });
}
/** Columns collapse with available width; minItemWidth controls the preferred item width. */
export function Grid({ size, gap, columns = 2, minItemWidth = '14rem', style, className, children, ...props }) {
    const resolved = useHdsSize(size);
    return _jsx(SizeContext.Provider, { value: resolved, children: _jsx("div", { ...props, "data-hds-size": resolved, "data-hds-gap": gap, className: `hds-grid${className ? ` ${className}` : ''}`, style: { '--hds-grid-columns': columns, '--hds-grid-min': minItemWidth, ...style }, children: children }) });
}
/** A centered, fluid container capped by its size with scaled horizontal padding. */
export function Container({ size, fluid = false, className, children, ...props }) {
    const resolved = useHdsSize(size);
    return _jsx(SizeContext.Provider, { value: resolved, children: _jsx("div", { ...props, "data-hds-size": resolved, "data-fluid": fluid, className: `hds-container${className ? ` ${className}` : ''}`, children: children }) });
}
