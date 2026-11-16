'use client';

import { useId } from 'react';
import type { ComponentPropsWithRef, MouseEvent } from 'react';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = 'primary', size = 'md', loading = false, loadingLabel,
  type = 'button', disabled, className, children, ref,
  'aria-busy': ariaBusy, 'aria-label': ariaLabel, ...props
}: ButtonProps) {
  return <button
    {...props}
    ref={ref}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading ? true : ariaBusy}
    aria-label={loading && loadingLabel ? loadingLabel : ariaLabel}
    className={`hds-button hds-button--${variant} hds-button--${size}${className ? ` ${className}` : ''}`}
  >{loading && loadingLabel ? loadingLabel : children}</button>;
}

type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
  label: string;
  type?: TextInputType;
  hint?: string;
  error?: string;
};

function descriptions(custom: string | undefined, hintId: string | undefined, errorId: string | undefined) {
  return [custom?.trim(), hintId, errorId].filter(Boolean).join(' ') || undefined;
}

export function TextField({
  label, hint, error, type = 'text', id, className, disabled, ref,
  'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return <div className={`hds-textField${disabled ? ' hds-textField--disabled' : ''}`}>
    <label className="hds-textField__label" htmlFor={inputId}>{label}</label>
    <input
      {...props}
      ref={ref}
      id={inputId}
      type={type}
      disabled={disabled}
      className={`hds-textField__input${className ? ` ${className}` : ''}`}
      aria-describedby={descriptions(ariaDescribedBy, hintId, errorId)}
      aria-invalid={error ? true : ariaInvalid}
    />
    {hint && <p className="hds-textField__hint" id={hintId}>{hint}</p>}
    {error && <p className="hds-textField__error" id={errorId}>{error}</p>}
  </div>;
}

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Checkbox({
  label, hint, error, id, className, disabled, readOnly, ref, onClick, onChange,
  'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid,
  'aria-readonly': ariaReadOnly, ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    // Checkbox has no native readonly behavior. Cancel its native click default,
    // including keyboard-generated clicks, while keeping it focusable and submittable.
    if (readOnly) event.preventDefault();
    onClick?.(event);
  };

  return <div className={`hds-checkbox${disabled ? ' hds-checkbox--disabled' : ''}${readOnly ? ' hds-checkbox--readOnly' : ''}`}>
    <label className="hds-checkbox__label" htmlFor={inputId}>
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        readOnly={readOnly}
        aria-readonly={readOnly ? true : ariaReadOnly}
        aria-describedby={descriptions(ariaDescribedBy, hintId, errorId)}
        aria-invalid={error ? true : ariaInvalid}
        className={`hds-checkbox__input${className ? ` ${className}` : ''}`}
        onClick={handleClick}
        onChange={readOnly ? undefined : onChange}
      />
      <span className="hds-checkbox__text">{label}</span>
    </label>
    {hint && <p className="hds-checkbox__hint" id={hintId}>{hint}</p>}
    {error && <p className="hds-checkbox__error" id={errorId}>{error}</p>}
  </div>;
}

export type BadgeProps = ComponentPropsWithRef<'span'> & {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};

export function Badge({ tone = 'neutral', className, children, ref, ...props }: BadgeProps) {
  return <span
    {...props}
    ref={ref}
    className={`hds-badge hds-badge--${tone}${className ? ` ${className}` : ''}`}
  >{children}</span>;
}
