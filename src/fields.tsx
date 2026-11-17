'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { useHdsSize } from './sizing.js';
import type { HdsSize } from './sizing.js';

type FieldText = { label: string; hint?: string; error?: string; size?: HdsSize };
type FieldShellProps = FieldText & { id: string; hintId?: string; errorId?: string; disabled?: boolean; children: ReactNode; labelNode?: ReactNode; className?: string; size: HdsSize };
type FieldDescription = { hintId?: string; errorId?: string; describedBy?: string; invalid?: boolean | 'grammar' | 'spelling' };

function ids(id: string, hint?: string, error?: string) {
  return { hintId: hint ? `${id}-hint` : undefined, errorId: error ? `${id}-error` : undefined };
}
function description({ hintId, errorId, describedBy }: FieldDescription) {
  return [describedBy?.trim(), hintId, errorId].filter(Boolean).join(' ') || undefined;
}
function assignInputRef(ref: Ref<HTMLInputElement> | undefined, node: HTMLInputElement | null) {
  if (typeof ref === 'function') return ref(node);
  if (ref) ref.current = node;
}
function useFormReset(reset: () => void, formId?: string, forwardedRef?: Ref<HTMLInputElement>) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const resetRef = useRef(reset);
  resetRef.current = reset;
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    setInput(node);
    const cleanup = assignInputRef(forwardedRef, node);
    if (node) return () => {
      setInput(current => current === node ? null : current);
      if (typeof cleanup === 'function') cleanup();
      else assignInputRef(forwardedRef, null);
    };
  }, [forwardedRef]);

  useEffect(() => {
    // The hidden native input knows its owner, including a form="id" outside the tree.
    const owner = input?.form;
    if (!owner) return;
    let active = true;
    const onReset = (event: Event) => {
      // reset is cancelable. Observe defaultPrevented after all form handlers run.
      queueMicrotask(() => {
        if (active && !event.defaultPrevented) resetRef.current();
      });
    };
    owner.addEventListener('reset', onReset);
    return () => { active = false; owner.removeEventListener('reset', onReset); };
  }, [input, formId]);
  return inputRef;
}
function copyInitial<T>(value: T): T {
  return Array.isArray(value) ? [...value] as T : value;
}
function useResettableValue<T>(value: T | undefined, defaultValue: T, form?: string, forwardedRef?: Ref<HTMLInputElement>, afterReset?: () => void) {
  const initial = useRef(copyInitial(defaultValue));
  const [local, setLocal] = useState<T>(() => copyInitial(initial.current));
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const controlled = value !== undefined;
  const inputRef = useFormReset(() => {
    if (!controlled) setLocal(copyInitial(initial.current));
    afterReset?.();
    // Native reset also mutates Base UI's hidden input. Re-render controlled fields
    // so React reapplies the caller-owned value after the browser's default action.
    refresh();
  }, form, forwardedRef);
  return {
    current: controlled ? value : local,
    change(next: T) { if (!controlled) setLocal(next); },
    inputRef,
  };
}
function FieldShell({ label, hint, error, id, hintId, errorId, disabled, children, labelNode, className, size }: FieldShellProps) {
  return <div data-hds-size={size} className={`hds-field${disabled ? ' hds-field--disabled' : ''}${className ? ` ${className}` : ''}`}>
    {labelNode === undefined ? <label className="hds-field__label" htmlFor={id}>{label}</label> : labelNode}
    {children}
    {hint && <p className="hds-field__hint" id={hintId}>{hint}</p>}
    {error && <p className="hds-field__error" id={errorId}>{error}</p>}
  </div>;
}

type TextualType = 'text' | 'email' | 'search' | 'tel' | 'url';
export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & { type?: TextualType; size?: HdsSize; inputSize?: number };
export function Input({ type = 'text', size, inputSize, className, ref, ...props }: InputProps) {
  const resolvedSize = useHdsSize(size);
  return <input {...props} ref={ref} type={type} size={inputSize} data-hds-size={resolvedSize} className={`hds-field__control${className ? ` ${className}` : ''}`} />;
}

export type TextareaProps = Omit<ComponentPropsWithRef<'textarea'>, 'children'> & FieldText;
export function Textarea({ label, hint, error, size, id, className, disabled, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <textarea {...props} ref={ref} id={inputId} disabled={disabled} className={`hds-field__control hds-field__textarea${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
  </FieldShell>;
}

function FieldChevron() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export type FieldOption = { value: string; label: string; disabled?: boolean };
function optionLabel(options: readonly FieldOption[], value: string | null | undefined) {
  return value == null ? '' : options.find(option => option.value === value)?.label ?? value;
}
type ChoiceProps = FieldText & {
  options: readonly FieldOption[];
  name?: string; form?: string; id?: string; required?: boolean; disabled?: boolean; readOnly?: boolean;
  value?: string | null; defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string; className?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'grammar' | 'spelling';
};

export type SelectProps = ChoiceProps & { ref?: Ref<HTMLButtonElement> };
export function Select({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder = '선택하세요', className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const selected = useResettableValue(value, defaultValue ?? null, form);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={triggerId} labelNode={null}>
    <BaseSelect.Root id={triggerId} items={options} name={name} form={form} required={required} disabled={disabled} readOnly={readOnly} value={selected.current} inputRef={selected.inputRef} onValueChange={next => { onValueChange?.(next); selected.change(next); }}>
      <BaseSelect.Label className="hds-field__label">{label}</BaseSelect.Label>
      <BaseSelect.Trigger ref={ref} id={triggerId} className={`hds-field__control hds-field__trigger${className ? ` ${className}` : ''}`} aria-label={label} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid}>
        <BaseSelect.Value placeholder={placeholder} /><BaseSelect.Icon className="hds-field__chevron" aria-hidden="true"><FieldChevron /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal><BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} data-hds-size={resolvedSize} className="hds-field__positioner"><BaseSelect.Popup className="hds-field__popup"><BaseSelect.List className="hds-field__list">
        {options.map(option => <BaseSelect.Item key={option.value} value={option.value} label={option.label} disabled={option.disabled} className="hds-field__option"><BaseSelect.ItemText>{option.label}</BaseSelect.ItemText><BaseSelect.ItemIndicator aria-hidden="true">✓</BaseSelect.ItemIndicator></BaseSelect.Item>)}
      </BaseSelect.List></BaseSelect.Popup></BaseSelect.Positioner></BaseSelect.Portal>
    </BaseSelect.Root>
  </FieldShell>;
}

export type ComboboxProps = ChoiceProps & {
  ref?: Ref<HTMLInputElement>;
  emptyText?: string;
  openLabel?: string;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (value: string) => void;
};
export function Combobox({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder = '검색해서 선택하세요', emptyText = '일치하는 항목이 없어요.', openLabel = '목록 열기', inputValue, defaultInputValue, onInputValueChange, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const items = BaseCombobox.createItems(options, { getValue: option => option.value, getLabel: option => option.label });
  const initialSelection = useRef(defaultValue ?? null);
  const [query, setQuery] = useState(() => defaultInputValue ?? optionLabel(options, value !== undefined ? value : initialSelection.current));
  const selected = useResettableValue(value, defaultValue ?? null, form, undefined, () => {
    if (inputValue === undefined) setQuery(defaultInputValue ?? optionLabel(options, value !== undefined ? value : initialSelection.current));
  });
  const controlledLabel = value !== undefined ? optionLabel(options, value) : '';
  useEffect(() => {
    if (value !== undefined && inputValue === undefined && defaultInputValue === undefined) setQuery(controlledLabel);
  }, [value, inputValue, defaultInputValue, controlledLabel]);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <BaseCombobox.Root<string, false, FieldOption> items={items} name={name} form={form} required={required} disabled={disabled} readOnly={readOnly} value={selected.current} inputRef={selected.inputRef} onValueChange={next => { onValueChange?.(next); selected.change(next); }} inputValue={inputValue !== undefined ? inputValue : query} onInputValueChange={next => { onInputValueChange?.(next); if (inputValue === undefined) setQuery(next); }}>
      <BaseCombobox.InputGroup className="hds-field__inputGroup">
        <BaseCombobox.Input ref={ref} id={inputId} placeholder={placeholder} className={`hds-field__control hds-field__comboInput${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
        <BaseCombobox.Trigger className="hds-field__iconButton" aria-label={openLabel} disabled={disabled || readOnly}><FieldChevron /></BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal><BaseCombobox.Positioner sideOffset={4} data-hds-size={resolvedSize} className="hds-field__positioner"><BaseCombobox.Popup className="hds-field__popup">
        <BaseCombobox.Empty className="hds-field__empty">{emptyText}</BaseCombobox.Empty>
        <BaseCombobox.List className="hds-field__list">{(option: FieldOption) => <BaseCombobox.Item key={option.value} value={option.value} disabled={option.disabled} className="hds-field__option"><span>{option.label}</span><BaseCombobox.ItemIndicator aria-hidden="true">✓</BaseCombobox.ItemIndicator></BaseCombobox.Item>}</BaseCombobox.List>
      </BaseCombobox.Popup></BaseCombobox.Positioner></BaseCombobox.Portal>
    </BaseCombobox.Root>
  </FieldShell>;
}

export type MultiSelectProps = Omit<ChoiceProps, 'value' | 'defaultValue' | 'onValueChange'> & {
  ref?: Ref<HTMLInputElement>;
  value?: readonly string[]; defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  emptyText?: string; openLabel?: string;
  selectedLabel?: string;
  removeLabel?: (label: string) => string;
  chipDescription?: string;
  inputDescription?: (count: number) => string;
  inputValue?: string; defaultInputValue?: string; onInputValueChange?: (value: string) => void;
};
export function MultiSelect({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder = '검색해서 선택하세요', emptyText = '일치하는 항목이 없어요.', openLabel = '목록 열기', selectedLabel = '선택한 항목', removeLabel = item => `${item} 제거`, chipDescription = 'Backspace 또는 Delete 키로 제거', inputDescription = count => `${count}개 선택됨. 입력 시작점에서 왼쪽 화살표 키를 누르면 선택 항목으로 이동합니다.`, inputValue, defaultInputValue, onInputValueChange, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }: MultiSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const items = BaseCombobox.createItems(options, { getValue: option => option.value, getLabel: option => option.label });
  const [query, setQuery] = useState(defaultInputValue ?? '');
  const selected = useResettableValue<readonly string[]>(value, defaultValue ?? [], form, undefined, () => {
    if (inputValue === undefined) setQuery(defaultInputValue ?? '');
  });
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <BaseCombobox.Root<string, true, FieldOption> items={items} multiple name={name} form={form} required={required} disabled={disabled} readOnly={readOnly} value={selected.current} inputRef={selected.inputRef} onValueChange={next => { onValueChange?.(next); selected.change(next); }} inputValue={inputValue !== undefined ? inputValue : query} onInputValueChange={next => { onInputValueChange?.(next); if (inputValue === undefined) setQuery(next); }}>
      <BaseCombobox.InputGroup className={`hds-field__inputGroup hds-field__multiGroup${className ? ` ${className}` : ''}`}>
        <BaseCombobox.Value>{(selected: string[]) => <BaseCombobox.Chips className="hds-field__chips" aria-label={selected.length ? selectedLabel : undefined}>
          {selected.map(item => { const itemLabel = options.find(option => option.value === item)?.label ?? item; return <BaseCombobox.Chip key={item} role="group" className="hds-field__chip" aria-label={itemLabel} aria-description={chipDescription}>{itemLabel}<BaseCombobox.ChipRemove className="hds-field__chipRemove" aria-label={removeLabel(itemLabel)} disabled={disabled || readOnly}><span aria-hidden="true">×</span></BaseCombobox.ChipRemove></BaseCombobox.Chip>; })}
          <BaseCombobox.Input ref={ref} id={inputId} placeholder={selected.length ? '' : placeholder} className="hds-field__comboInput hds-field__multiInput" aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} aria-description={selected.length ? inputDescription(selected.length) : undefined} />
        </BaseCombobox.Chips>}</BaseCombobox.Value>
        <BaseCombobox.Trigger className="hds-field__iconButton" aria-label={openLabel} disabled={disabled || readOnly}><FieldChevron /></BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal><BaseCombobox.Positioner sideOffset={4} data-hds-size={resolvedSize} className="hds-field__positioner"><BaseCombobox.Popup className="hds-field__popup">
        <BaseCombobox.Empty className="hds-field__empty">{emptyText}</BaseCombobox.Empty>
        <BaseCombobox.List className="hds-field__list">{(option: FieldOption) => <BaseCombobox.Item key={option.value} value={option.value} disabled={option.disabled} className="hds-field__option"><span>{option.label}</span><BaseCombobox.ItemIndicator aria-hidden="true">✓</BaseCombobox.ItemIndicator></BaseCombobox.Item>}</BaseCombobox.List>
      </BaseCombobox.Popup></BaseCombobox.Positioner></BaseCombobox.Portal>
    </BaseCombobox.Root>
  </FieldShell>;
}

export type SwitchProps = FieldText & { id?: string; name?: string; form?: string; value?: string; uncheckedValue?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void; ref?: Ref<HTMLInputElement>; className?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'grammar' | 'spelling' };
export function Switch({ label, hint, error, size, id, name, form, value, uncheckedValue, required, disabled, readOnly, checked, defaultChecked, onCheckedChange, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const selection = useResettableValue(checked, defaultChecked ?? false, form, ref);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId} labelNode={<span className="hds-field__label">{label}</span>}>
    <BaseSwitch.Root id={inputId} inputRef={selection.inputRef} name={name} form={form} value={value} uncheckedValue={uncheckedValue} required={required} disabled={disabled} readOnly={readOnly} checked={selection.current} onCheckedChange={next => { onCheckedChange?.(next); selection.change(next); }} className={`hds-field__switch${className ? ` ${className}` : ''}`} aria-label={label} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid}><BaseSwitch.Thumb className="hds-field__switchThumb" /></BaseSwitch.Root>
  </FieldShell>;
}

export type RadioGroupProps = FieldText & { options: readonly FieldOption[]; name?: string; form?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; ref?: Ref<HTMLInputElement>; className?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'grammar' | 'spelling' };
export function RadioGroup({ label, hint, error, size, options, name, form, required, disabled, readOnly, value, defaultValue, onValueChange, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }: RadioGroupProps) {
  const generatedId = useId();
  const { hintId, errorId } = ids(generatedId, hint, error);
  const selection = useResettableValue<string | null>(value, defaultValue ?? null, form, ref);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={generatedId} labelNode={<span className="hds-field__label" id={`${generatedId}-label`}>{label}</span>}>
    <BaseRadioGroup<string | null> value={selection.current} onValueChange={next => { if (next !== null) onValueChange?.(next); selection.change(next); }} name={name} form={form} required={required} disabled={disabled} readOnly={readOnly} inputRef={selection.inputRef} className={`hds-field__radioGroup${className ? ` ${className}` : ''}`} aria-labelledby={`${generatedId}-label`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid}>
      {options.map(option => <label key={option.value} className="hds-field__radioOption"><BaseRadio.Root value={option.value} disabled={option.disabled} className="hds-field__radio"><BaseRadio.Indicator className="hds-field__radioIndicator" /></BaseRadio.Root><span>{option.label}</span></label>)}
    </BaseRadioGroup>
  </FieldShell>;
}

export type SliderProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'readOnly'> & FieldText & { inputSize?: number };
export function Slider({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: SliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <input {...props} size={inputSize} ref={ref} id={inputId} type="range" disabled={disabled} className={`hds-field__slider${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
  </FieldShell>;
}

export type NumberFieldProps = FieldText & { id?: string; name?: string; form?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; value?: number | null; defaultValue?: number; onValueChange?: (value: number | null) => void; min?: number; max?: number; step?: number | 'any'; locale?: Intl.LocalesArgument; placeholder?: string; incrementLabel?: string; decrementLabel?: string; ref?: Ref<HTMLInputElement>; className?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'grammar' | 'spelling' };
export function NumberField({ label, hint, error, size, id, name, form, required, disabled, readOnly, value, defaultValue, onValueChange, min, max, step, locale, placeholder, incrementLabel = '값 증가', decrementLabel = '값 감소', ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }: NumberFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef<HTMLInputElement | null>(null);
  const focusTarget = useRef<number | null>(null);
  const [resetKey, bumpResetKey] = useReducer((count: number) => count + 1, 0);
  const visibleInputRef = useCallback((node: HTMLInputElement | null) => {
    visibleRef.current = node;
    const cleanup = assignInputRef(ref, node);
    if (node) return () => {
      if (visibleRef.current === node) visibleRef.current = null;
      if (typeof cleanup === 'function') cleanup();
      else assignInputRef(ref, null);
    };
  }, [ref]);
  const number = useResettableValue(value, defaultValue ?? null, form, undefined, () => {
    const root = rootRef.current;
    const active = root?.ownerDocument.activeElement;
    focusTarget.current = active === visibleRef.current ? -1 : active && root?.contains(active)
      ? Array.from(root.querySelectorAll('button')).indexOf(active as HTMLButtonElement)
      : null;
    // Base UI 1.9 keeps a separate editable string buffer. It has no reset API;
    // a new root reconstructs that buffer from the accepted reset value.
    bumpResetKey();
  });
  useLayoutEffect(() => {
    if (focusTarget.current === null) return;
    const target = focusTarget.current === -1 ? visibleRef.current : rootRef.current?.querySelectorAll('button')[focusTarget.current];
    focusTarget.current = null;
    target?.focus();
  }, [resetKey]);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <BaseNumberField.Root key={resetKey} ref={rootRef} id={inputId} name={name} form={form} required={required} disabled={disabled} readOnly={readOnly} value={number.current} inputRef={number.inputRef} onValueChange={next => { onValueChange?.(next); number.change(next); }} min={min} max={max} step={step} locale={locale}>
      <BaseNumberField.Group className="hds-field__numberGroup">
        <BaseNumberField.Input ref={visibleInputRef} id={inputId} placeholder={placeholder} className={`hds-field__control hds-field__numberInput${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
        <BaseNumberField.Decrement className="hds-field__stepper" aria-label={decrementLabel}><span aria-hidden="true">−</span></BaseNumberField.Decrement>
        <BaseNumberField.Increment className="hds-field__stepper" aria-label={incrementLabel}><span aria-hidden="true">+</span></BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  </FieldShell>;
}

export type DateFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & FieldText & { inputSize?: number };
export function DateField({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: DateFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <input {...props} size={inputSize} ref={ref} id={inputId} type="date" disabled={disabled} className={`hds-field__control${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
  </FieldShell>;
}

export type FileInputProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'value' | 'defaultValue' | 'readOnly'> & FieldText & { inputSize?: number };
export function FileInput({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: FileInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <input {...props} size={inputSize} ref={ref} id={inputId} type="file" disabled={disabled} className={`hds-field__control hds-field__file${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
  </FieldShell>;
}

export type PasswordFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'> & FieldText & { inputSize?: number; showLabel?: string; hideLabel?: string };
export function PasswordField({ label, hint, error, size, inputSize, id, disabled, className, ref, showLabel = '비밀번호 표시', hideLabel = '비밀번호 숨기기', 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { hintId, errorId } = ids(generatedId, hint, error);
  const [visible, setVisible] = useState(false);
  const resolvedSize = useHdsSize(size);
  return <FieldShell {...{ label, hint, error, hintId, errorId, disabled }} size={resolvedSize} id={inputId}>
    <div className="hds-field__passwordGroup">
      <input {...props} size={inputSize} ref={ref} id={inputId} type={visible ? 'text' : 'password'} disabled={disabled} className={`hds-field__control hds-field__passwordInput${className ? ` ${className}` : ''}`} aria-describedby={description({ hintId, errorId, describedBy })} aria-invalid={error ? true : invalid} />
      <button type="button" className="hds-field__passwordToggle" disabled={disabled} aria-label={visible ? hideLabel : showLabel} aria-pressed={visible} onClick={() => setVisible(previous => !previous)}>{visible ? hideLabel : showLabel}</button>
    </div>
  </FieldShell>;
}
