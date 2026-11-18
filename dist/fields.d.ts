import type { ComponentPropsWithRef, Ref } from 'react';
import type { HdsSize } from './sizing.js';
type FieldText = {
    label: string;
    hint?: string;
    error?: string;
    size?: HdsSize;
};
type TextualType = 'text' | 'email' | 'search' | 'tel' | 'url';
export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & {
    type?: TextualType;
    size?: HdsSize;
    inputSize?: number;
};
export declare function Input({ type, size, inputSize, className, ref, ...props }: InputProps): import("react").JSX.Element;
export type TextareaProps = Omit<ComponentPropsWithRef<'textarea'>, 'children'> & FieldText;
export declare function Textarea({ label, hint, error, size, id, className, disabled, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: TextareaProps): import("react").JSX.Element;
export type FieldOption = {
    value: string;
    label: string;
    disabled?: boolean;
};
type ChoiceProps = FieldText & {
    options: readonly FieldOption[];
    name?: string;
    form?: string;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    placeholder?: string;
    className?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'grammar' | 'spelling';
};
export type SelectProps = ChoiceProps & {
    ref?: Ref<HTMLButtonElement>;
};
export declare function Select({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: SelectProps): import("react").JSX.Element;
/** Native picker for fixed choices when browser and screen-reader controls are preferred. */
export type NativeSelectProps = Omit<ChoiceProps, 'readOnly'> & {
    ref?: Ref<HTMLSelectElement>;
};
export declare function NativeSelect({ label, hint, error, size, options, name, form, id, required, disabled, value, defaultValue, onValueChange, placeholder, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: NativeSelectProps): import("react").JSX.Element;
export type ComboboxProps = ChoiceProps & {
    ref?: Ref<HTMLInputElement>;
    emptyText?: string;
    openLabel?: string;
    inputValue?: string;
    defaultInputValue?: string;
    onInputValueChange?: (value: string) => void;
};
export declare function Combobox({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder, emptyText, openLabel, inputValue, defaultInputValue, onInputValueChange, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: ComboboxProps): import("react").JSX.Element;
export type MultiSelectProps = Omit<ChoiceProps, 'value' | 'defaultValue' | 'onValueChange'> & {
    ref?: Ref<HTMLInputElement>;
    value?: readonly string[];
    defaultValue?: readonly string[];
    onValueChange?: (value: string[]) => void;
    emptyText?: string;
    openLabel?: string;
    selectedLabel?: string;
    removeLabel?: (label: string) => string;
    chipDescription?: string;
    inputDescription?: (count: number) => string;
    inputValue?: string;
    defaultInputValue?: string;
    onInputValueChange?: (value: string) => void;
};
export declare function MultiSelect({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder, emptyText, openLabel, selectedLabel, removeLabel, chipDescription, inputDescription, inputValue, defaultInputValue, onInputValueChange, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: MultiSelectProps): import("react").JSX.Element;
export type SwitchProps = FieldText & {
    id?: string;
    name?: string;
    form?: string;
    value?: string;
    uncheckedValue?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    ref?: Ref<HTMLInputElement>;
    className?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'grammar' | 'spelling';
};
export declare function Switch({ label, hint, error, size, id, name, form, value, uncheckedValue, required, disabled, readOnly, checked, defaultChecked, onCheckedChange, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }: SwitchProps): import("react").JSX.Element;
export type RadioGroupProps = FieldText & {
    options: readonly FieldOption[];
    name?: string;
    form?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    ref?: Ref<HTMLInputElement>;
    className?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'grammar' | 'spelling';
};
export declare function RadioGroup({ label, hint, error, size, options, name, form, required, disabled, readOnly, value, defaultValue, onValueChange, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }: RadioGroupProps): import("react").JSX.Element;
export type SliderProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'readOnly'> & FieldText & {
    inputSize?: number;
};
export declare function Slider({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: SliderProps): import("react").JSX.Element;
export type NumberFieldProps = FieldText & {
    id?: string;
    name?: string;
    form?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    value?: number | null;
    defaultValue?: number;
    onValueChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number | 'any';
    locale?: Intl.LocalesArgument;
    placeholder?: string;
    incrementLabel?: string;
    decrementLabel?: string;
    ref?: Ref<HTMLInputElement>;
    className?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'grammar' | 'spelling';
};
export declare function NumberField({ label, hint, error, size, id, name, form, required, disabled, readOnly, value, defaultValue, onValueChange, min, max, step, locale, placeholder, incrementLabel, decrementLabel, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }: NumberFieldProps): import("react").JSX.Element;
export type DateFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & FieldText & {
    inputSize?: number;
};
export declare function DateField({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: DateFieldProps): import("react").JSX.Element;
export type FileInputProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'value' | 'defaultValue' | 'readOnly'> & FieldText & {
    inputSize?: number;
};
export declare function FileInput({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: FileInputProps): import("react").JSX.Element;
export type PasswordFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & FieldText & {
    inputSize?: number;
    showLabel?: string;
    hideLabel?: string;
};
export declare function PasswordField({ label, hint, error, size, inputSize, id, disabled, className, ref, showLabel, hideLabel, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: PasswordFieldProps): import("react").JSX.Element;
export {};
