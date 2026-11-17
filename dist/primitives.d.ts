import type { HdsSize } from './sizing.js';
import type { ComponentPropsWithRef } from 'react';
export type ButtonProps = ComponentPropsWithRef<'button'> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: HdsSize;
    loading?: boolean;
    loadingLabel?: string;
};
export declare function Button({ variant, size, loading, loadingLabel, type, disabled, className, children, ref, 'aria-busy': ariaBusy, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...props }: ButtonProps): import("react").JSX.Element;
type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
export type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & {
    size?: HdsSize;
    inputSize?: number;
    label: string;
    type?: TextInputType;
    hint?: string;
    error?: string;
};
export declare function TextField({ label, hint, error, size, inputSize, type, id, className, disabled, ref, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }: TextFieldProps): import("react").JSX.Element;
export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & {
    size?: HdsSize;
    inputSize?: number;
    label: string;
    hint?: string;
    error?: string;
};
export declare function Checkbox({ label, hint, error, size, inputSize, id, className, disabled, readOnly, ref, onClick, onChange, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, 'aria-readonly': ariaReadOnly, ...props }: CheckboxProps): import("react").JSX.Element;
export type BadgeProps = ComponentPropsWithRef<'span'> & {
    size?: HdsSize;
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};
export declare function Badge({ size, tone, className, children, ref, ...props }: BadgeProps): import("react").JSX.Element;
export {};
