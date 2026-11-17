'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useHdsSize } from './sizing.js';
import { useId } from 'react';
export function Button({ variant = 'primary', size, loading = false, loadingLabel, type = 'button', disabled, className, children, ref, 'aria-busy': ariaBusy, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...props }) {
    const resolvedSize = useHdsSize(size);
    const showLoadingLabel = loading && Boolean(loadingLabel);
    return _jsx("button", { ...props, ref: ref, type: type, "data-hds-size": resolvedSize, disabled: disabled || loading, "aria-busy": loading ? true : ariaBusy, "aria-label": showLoadingLabel ? loadingLabel : ariaLabel, "aria-labelledby": showLoadingLabel ? undefined : ariaLabelledBy, className: `hds-button hds-button--${variant} hds-button--${resolvedSize}${className ? ` ${className}` : ''}`, children: showLoadingLabel ? loadingLabel : children });
}
function descriptions(custom, hintId, errorId) {
    return [custom?.trim(), hintId, errorId].filter(Boolean).join(' ') || undefined;
}
export function TextField({ label, hint, error, size, inputSize, type = 'text', id, className, disabled, ref, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }) {
    const resolvedSize = useHdsSize(size);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${generatedId}-hint` : undefined;
    const errorId = error ? `${generatedId}-error` : undefined;
    return _jsxs("div", { "data-hds-size": resolvedSize, className: `hds-textField${disabled ? ' hds-textField--disabled' : ''}`, children: [_jsx("label", { className: "hds-textField__label", htmlFor: inputId, children: label }), _jsx("input", { ...props, ref: ref, id: inputId, type: type, size: inputSize, disabled: disabled, className: `hds-textField__input${className ? ` ${className}` : ''}`, "aria-describedby": descriptions(ariaDescribedBy, hintId, errorId), "aria-invalid": error ? true : ariaInvalid }), hint && _jsx("p", { className: "hds-textField__hint", id: hintId, children: hint }), error && _jsx("p", { className: "hds-textField__error", id: errorId, children: error })] });
}
export function Checkbox({ label, hint, error, size, inputSize, id, className, disabled, readOnly, ref, onClick, onChange, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, 'aria-readonly': ariaReadOnly, ...props }) {
    const resolvedSize = useHdsSize(size);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${generatedId}-hint` : undefined;
    const errorId = error ? `${generatedId}-error` : undefined;
    const handleClick = (event) => {
        // Checkbox has no native readonly behavior. Cancel its native click default,
        // including keyboard-generated clicks, while keeping it focusable and submittable.
        if (readOnly)
            event.preventDefault();
        onClick?.(event);
    };
    return _jsxs("div", { "data-hds-size": resolvedSize, className: `hds-checkbox${disabled ? ' hds-checkbox--disabled' : ''}${readOnly ? ' hds-checkbox--readOnly' : ''}`, children: [_jsxs("label", { className: "hds-checkbox__label", htmlFor: inputId, children: [_jsx("input", { ...props, ref: ref, id: inputId, type: "checkbox", size: inputSize, disabled: disabled, readOnly: readOnly, "aria-readonly": readOnly ? true : ariaReadOnly, "aria-describedby": descriptions(ariaDescribedBy, hintId, errorId), "aria-invalid": error ? true : ariaInvalid, className: `hds-checkbox__input${className ? ` ${className}` : ''}`, onClick: handleClick, onChange: readOnly ? undefined : onChange }), _jsx("span", { className: "hds-checkbox__text", children: label })] }), hint && _jsx("p", { className: "hds-checkbox__hint", id: hintId, children: hint }), error && _jsx("p", { className: "hds-checkbox__error", id: errorId, children: error })] });
}
export function Badge({ size, tone = 'neutral', className, children, ref, ...props }) {
    const resolvedSize = useHdsSize(size);
    return _jsx("span", { "data-hds-size": resolvedSize, ...props, ref: ref, className: `hds-badge hds-badge--${tone}${className ? ` ${className}` : ''}`, children: children });
}
