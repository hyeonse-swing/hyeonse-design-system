import type { ComponentPropsWithRef } from 'react';
export type ButtonProps = ComponentPropsWithRef<'button'> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md';
    loading?: boolean;
    loadingLabel?: string;
};
export declare function Button({ variant, size, loading, loadingLabel, type, disabled, className, children, ref, 'aria-busy': ariaBusy, 'aria-label': ariaLabel, ...props }: ButtonProps): import("react").JSX.Element;
type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
export type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
    label: string;
    type?: TextInputType;
    hint?: string;
    error?: string;
};
export declare function TextField({ label, hint, error, type, id, className, disabled, ref, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }: TextFieldProps): import("react").JSX.Element;
export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
    label: string;
    hint?: string;
    error?: string;
};
export declare function Checkbox({ label, hint, error, id, className, disabled, readOnly, ref, onClick, onChange, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, 'aria-readonly': ariaReadOnly, ...props }: CheckboxProps): import("react").JSX.Element;
export type BadgeProps = ComponentPropsWithRef<'span'> & {
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};
export declare function Badge({ tone, className, children, ref, ...props }: BadgeProps): import("react").JSX.Element;
export {};
