'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
export function Button({ variant = 'primary', size = 'md', loading = false, loadingLabel, type = 'button', disabled, className, children, ref, 'aria-busy': ariaBusy, 'aria-label': ariaLabel, ...props }) {
    return _jsx("button", { ...props, ref: ref, type: type, disabled: disabled || loading, "aria-busy": loading ? true : ariaBusy, "aria-label": loading && loadingLabel ? loadingLabel : ariaLabel, className: `hds-button hds-button--${variant} hds-button--${size}${className ? ` ${className}` : ''}`, children: loading && loadingLabel ? loadingLabel : children });
}
function descriptions(custom, hintId, errorId) {
    return [custom?.trim(), hintId, errorId].filter(Boolean).join(' ') || undefined;
}
export function TextField({ label, hint, error, type = 'text', id, className, disabled, ref, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    return _jsxs("div", { className: `hds-textField${disabled ? ' hds-textField--disabled' : ''}`, children: [_jsx("label", { className: "hds-textField__label", htmlFor: inputId, children: label }), _jsx("input", { ...props, ref: ref, id: inputId, type: type, disabled: disabled, className: `hds-textField__input${className ? ` ${className}` : ''}`, "aria-describedby": descriptions(ariaDescribedBy, hintId, errorId), "aria-invalid": error ? true : ariaInvalid }), hint && _jsx("p", { className: "hds-textField__hint", id: hintId, children: hint }), error && _jsx("p", { className: "hds-textField__error", id: errorId, children: error })] });
}
export function Checkbox({ label, hint, error, id, className, disabled, readOnly, ref, onClick, onChange, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, 'aria-readonly': ariaReadOnly, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const handleClick = (event) => {
        // Checkbox has no native readonly behavior. Cancel its native click default,
        // including keyboard-generated clicks, while keeping it focusable and submittable.
        if (readOnly)
            event.preventDefault();
        onClick?.(event);
    };
    return _jsxs("div", { className: `hds-checkbox${disabled ? ' hds-checkbox--disabled' : ''}${readOnly ? ' hds-checkbox--readOnly' : ''}`, children: [_jsxs("label", { className: "hds-checkbox__label", htmlFor: inputId, children: [_jsx("input", { ...props, ref: ref, id: inputId, type: "checkbox", disabled: disabled, readOnly: readOnly, "aria-readonly": readOnly ? true : ariaReadOnly, "aria-describedby": descriptions(ariaDescribedBy, hintId, errorId), "aria-invalid": error ? true : ariaInvalid, className: `hds-checkbox__input${className ? ` ${className}` : ''}`, onClick: handleClick, onChange: readOnly ? undefined : onChange }), _jsx("span", { className: "hds-checkbox__text", children: label })] }), hint && _jsx("p", { className: "hds-checkbox__hint", id: hintId, children: hint }), error && _jsx("p", { className: "hds-checkbox__error", id: errorId, children: error })] });
}
export function Badge({ tone = 'neutral', className, children, ref, ...props }) {
    return _jsx("span", { ...props, ref: ref, className: `hds-badge hds-badge--${tone}${className ? ` ${className}` : ''}`, children: children });
}
