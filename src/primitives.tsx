'use client';

import { useHdsSize } from './sizing.js';
import type { HdsSize } from './sizing.js';
import { useId } from 'react';
import type { ComponentPropsWithRef, MouseEvent } from 'react';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: HdsSize;
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = 'primary', size, loading = false, loadingLabel,
  type = 'button', disabled, className, children, ref,
  'aria-busy': ariaBusy, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...props
}: ButtonProps) {
  const resolvedSize = useHdsSize(size);
  const showLoadingLabel = loading && Boolean(loadingLabel);
  return <button
    {...props}
    ref={ref}
    type={type}
    data-hds-size={resolvedSize}
    disabled={disabled || loading}
    aria-busy={loading ? true : ariaBusy}
    aria-label={showLoadingLabel ? loadingLabel : ariaLabel}
    aria-labelledby={showLoadingLabel ? undefined : ariaLabelledBy}
    className={`hds-button hds-button--${variant} hds-button--${resolvedSize}${className ? ` ${className}` : ''}`}
  >{showLoadingLabel ? loadingLabel : children}</button>;
}

type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & {
  size?: HdsSize;
  inputSize?: number;
  label: string;
  type?: TextInputType;
  hint?: string;
  error?: string;
};

function descriptions(custom: string | undefined, hintId: string | undefined, errorId: string | undefined) {
  return [custom?.trim(), hintId, errorId].filter(Boolean).join(' ') || undefined;
}

export function TextField({
  label, hint, error, size, inputSize, type = 'text', id, className, disabled, ref,
  'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props
}: TextFieldProps) {
  const resolvedSize = useHdsSize(size);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;

  return <div data-hds-size={resolvedSize} className={`hds-textField${disabled ? ' hds-textField--disabled' : ''}`}>
    <label className="hds-textField__label" htmlFor={inputId}>{label}</label>
    <input
      {...props}
      ref={ref}
      id={inputId}
      type={type}
      size={inputSize}
      disabled={disabled}
      className={`hds-textField__input${className ? ` ${className}` : ''}`}
      aria-describedby={descriptions(ariaDescribedBy, hintId, errorId)}
      aria-invalid={error ? true : ariaInvalid}
    />
    {hint && <p className="hds-textField__hint" id={hintId}>{hint}</p>}
    {error && <p className="hds-textField__error" id={errorId}>{error}</p>}
  </div>;
}

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & {
  size?: HdsSize;
  inputSize?: number;
  label: string;
  hint?: string;
  error?: string;
};

export function Checkbox({
  label, hint, error, size, inputSize, id, className, disabled, readOnly, ref, onClick, onChange,
  'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid,
  'aria-readonly': ariaReadOnly, ...props
}: CheckboxProps) {
  const resolvedSize = useHdsSize(size);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    // Checkbox has no native readonly behavior. Cancel its native click default,
    // including keyboard-generated clicks, while keeping it focusable and submittable.
    if (readOnly) event.preventDefault();
    onClick?.(event);
  };

  return <div data-hds-size={resolvedSize} className={`hds-checkbox${disabled ? ' hds-checkbox--disabled' : ''}${readOnly ? ' hds-checkbox--readOnly' : ''}`}>
    <label className="hds-checkbox__label" htmlFor={inputId}>
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="checkbox"
        size={inputSize}
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
  size?: HdsSize;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};

export function Badge({ size, tone = 'neutral', className, children, ref, ...props }: BadgeProps) {
  const resolvedSize = useHdsSize(size);
  return <span
    data-hds-size={resolvedSize}
    {...props}
    ref={ref}
    className={`hds-badge hds-badge--${tone}${className ? ` ${className}` : ''}`}
  >{children}</span>;
}
