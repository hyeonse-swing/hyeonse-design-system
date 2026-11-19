'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { useHdsSize } from './sizing.js';
import { useHdsFocusGuardLabels } from './focus-guard-labels.js';
function ids(id, hint, error) {
    return { hintId: hint ? `${id}-hint` : undefined, errorId: error ? `${id}-error` : undefined };
}
function description({ hintId, errorId, describedBy }) {
    return [describedBy?.trim(), hintId, errorId].filter(Boolean).join(' ') || undefined;
}
function assignInputRef(ref, node) {
    if (typeof ref === 'function')
        return ref(node);
    if (ref)
        ref.current = node;
}
function useFormReset(reset, formId, forwardedRef) {
    const [input, setInput] = useState(null);
    const resetRef = useRef(reset);
    resetRef.current = reset;
    const inputRef = useCallback((node) => {
        setInput(node);
        const cleanup = assignInputRef(forwardedRef, node);
        if (node)
            return () => {
                setInput(current => current === node ? null : current);
                if (typeof cleanup === 'function')
                    cleanup();
                else
                    assignInputRef(forwardedRef, null);
            };
    }, [forwardedRef]);
    useEffect(() => {
        // The hidden native input knows its owner, including a form="id" outside the tree.
        const owner = input?.form;
        if (!owner)
            return;
        let active = true;
        const onReset = (event) => {
            // reset is cancelable. Observe defaultPrevented after all form handlers run.
            queueMicrotask(() => {
                if (active && !event.defaultPrevented)
                    resetRef.current();
            });
        };
        owner.addEventListener('reset', onReset);
        return () => { active = false; owner.removeEventListener('reset', onReset); };
    }, [input, formId]);
    return { input, inputRef };
}
function copyInitial(value) {
    return Array.isArray(value) ? [...value] : value;
}
function useResettableValue(value, defaultValue, form, forwardedRef, afterReset) {
    const initial = useRef(copyInitial(defaultValue));
    const [local, setLocal] = useState(() => copyInitial(initial.current));
    const [, refresh] = useReducer((count) => count + 1, 0);
    const controlled = value !== undefined;
    const { input, inputRef } = useFormReset(() => {
        if (!controlled)
            setLocal(copyInitial(initial.current));
        afterReset?.();
        // Native reset also mutates Base UI's hidden input. Re-render controlled fields
        // so React reapplies the caller-owned value after the browser's default action.
        refresh();
    }, form, forwardedRef);
    return {
        current: controlled ? value : local,
        change(next) { if (!controlled)
            setLocal(next); },
        input,
        inputRef,
    };
}
function FieldShell({ label, hint, error, id, hintId, errorId, disabled, children, labelNode, className, size }) {
    return _jsxs("div", { "data-hds-size": size, className: `hds-field${disabled ? ' hds-field--disabled' : ''}${className ? ` ${className}` : ''}`, children: [labelNode === undefined ? _jsx("label", { className: "hds-field__label", htmlFor: id, children: label }) : labelNode, children, hint && _jsx("p", { className: "hds-field__hint", id: hintId, children: hint }), error && _jsx("p", { className: "hds-field__error", id: errorId, children: error })] });
}
export function Input({ type = 'text', size, inputSize, className, ref, ...props }) {
    const resolvedSize = useHdsSize(size);
    return _jsx("input", { ...props, ref: ref, type: type, size: inputSize, "data-hds-size": resolvedSize, className: `hds-field__control${className ? ` ${className}` : ''}` });
}
export function Textarea({ label, hint, error, size, id, className, disabled, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsx("textarea", { ...props, ref: ref, id: inputId, disabled: disabled, className: `hds-field__control hds-field__textarea${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }) });
}
function FieldChevron() {
    return _jsx("svg", { viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "m5 7.5 5 5 5-5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) });
}
function optionLabel(options, value) {
    return value == null ? '' : options.find(option => option.value === value)?.label ?? value;
}
export function Select({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder = '선택하세요', className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    useHdsFocusGuardLabels();
    const generatedId = useId();
    const triggerId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const selected = useResettableValue(value, defaultValue ?? null, form);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: triggerId, labelNode: null, children: _jsxs(BaseSelect.Root, { id: triggerId, items: options, name: name, form: form, required: required, disabled: disabled, readOnly: readOnly, value: selected.current, inputRef: selected.inputRef, onValueChange: next => { onValueChange?.(next); selected.change(next); }, children: [_jsx(BaseSelect.Label, { className: "hds-field__label", children: label }), _jsxs(BaseSelect.Trigger, { ref: ref, id: triggerId, className: `hds-field__control hds-field__trigger${className ? ` ${className}` : ''}`, "aria-label": label, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid, children: [_jsx(BaseSelect.Value, { placeholder: placeholder }), _jsx(BaseSelect.Icon, { className: "hds-field__chevron", "aria-hidden": "true", children: _jsx(FieldChevron, {}) })] }), _jsx(BaseSelect.Portal, { children: _jsx(BaseSelect.Positioner, { sideOffset: 4, alignItemWithTrigger: false, "data-hds-size": resolvedSize, className: "hds-field__positioner", children: _jsx(BaseSelect.Popup, { className: "hds-field__popup", children: _jsx(BaseSelect.List, { className: "hds-field__list", children: options.map(option => _jsxs(BaseSelect.Item, { value: option.value, label: option.label, disabled: option.disabled, className: "hds-field__option", children: [_jsx(BaseSelect.ItemText, { children: option.label }), _jsx(BaseSelect.ItemIndicator, { "aria-hidden": "true", children: "\u2713" })] }, option.value)) }) }) }) })] }) });
}
export function NativeSelect({ label, hint, error, size, options, name, form, id, required, disabled, value, defaultValue, onValueChange, placeholder = '선택하세요', className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const resolvedSize = useHdsSize(size);
    const selectRef = useRef(null);
    const setRef = useCallback((node) => {
        selectRef.current = node;
        if (typeof ref === 'function')
            ref(node);
        else if (ref)
            ref.current = node;
    }, [ref]);
    useLayoutEffect(() => {
        const select = selectRef.current;
        if (!select || value === undefined)
            return;
        // A native form reset restores each option's defaultSelected flag before
        // returning to the caller. Keep that default aligned with the controlled
        // value so synchronous FormData reads see the same value as React.
        for (const option of Array.from(select.options))
            option.defaultSelected = option.value === (value ?? '');
    }, [value, options]);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsxs("div", { className: "hds-field__nativeSelectWrap", children: [_jsxs("select", { ref: setRef, id: inputId, name: name, form: form, required: required, disabled: disabled, value: value === undefined ? undefined : value ?? '', defaultValue: value === undefined ? defaultValue ?? '' : undefined, onChange: event => onValueChange?.(event.currentTarget.value || null), "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid, className: `hds-field__control hds-field__nativeSelect${className ? ` ${className}` : ''}`, children: [_jsx("option", { value: "", disabled: required, children: placeholder }), options.map(option => _jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value))] }), _jsx("span", { className: "hds-field__chevron hds-field__nativeSelectIcon", "aria-hidden": "true", children: _jsx(FieldChevron, {}) })] }) });
}
export function Combobox({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder = '검색해서 선택하세요', emptyText = '일치하는 항목이 없어요.', openLabel = '목록 열기', inputValue, defaultInputValue, onInputValueChange, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    useHdsFocusGuardLabels();
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const items = BaseCombobox.createItems(options, { getValue: option => option.value, getLabel: option => option.label });
    const initialSelection = useRef(defaultValue ?? null);
    const [query, setQuery] = useState(() => defaultInputValue ?? optionLabel(options, value !== undefined ? value : initialSelection.current));
    const selected = useResettableValue(value, defaultValue ?? null, form, undefined, () => {
        if (inputValue === undefined)
            setQuery(defaultInputValue ?? optionLabel(options, value !== undefined ? value : initialSelection.current));
    });
    const controlledLabel = value !== undefined ? optionLabel(options, value) : '';
    useEffect(() => {
        if (value !== undefined && inputValue === undefined && defaultInputValue === undefined)
            setQuery(controlledLabel);
    }, [value, inputValue, defaultInputValue, controlledLabel]);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsxs(BaseCombobox.Root, { items: items, name: name, form: form, required: required, disabled: disabled, readOnly: readOnly, value: selected.current, inputRef: selected.inputRef, onValueChange: next => { onValueChange?.(next); selected.change(next); }, inputValue: inputValue !== undefined ? inputValue : query, onInputValueChange: next => { onInputValueChange?.(next); if (inputValue === undefined)
                setQuery(next); }, children: [_jsxs(BaseCombobox.InputGroup, { className: "hds-field__inputGroup", children: [_jsx(BaseCombobox.Input, { ref: ref, id: inputId, placeholder: placeholder, className: `hds-field__control hds-field__comboInput${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }), _jsx(BaseCombobox.Trigger, { className: "hds-field__iconButton", "aria-label": openLabel, disabled: disabled || readOnly, children: _jsx(FieldChevron, {}) })] }), _jsx(BaseCombobox.Portal, { children: _jsx(BaseCombobox.Positioner, { sideOffset: 4, "data-hds-size": resolvedSize, className: "hds-field__positioner", children: _jsxs(BaseCombobox.Popup, { className: "hds-field__popup", children: [_jsx(BaseCombobox.Empty, { className: "hds-field__empty", children: emptyText }), _jsx(BaseCombobox.List, { className: "hds-field__list", children: (option) => _jsxs(BaseCombobox.Item, { value: option.value, disabled: option.disabled, className: "hds-field__option", children: [_jsx("span", { children: option.label }), _jsx(BaseCombobox.ItemIndicator, { "aria-hidden": "true", children: "\u2713" })] }, option.value) })] }) }) })] }) });
}
export function MultiSelect({ label, hint, error, size, options, name, form, id, required, disabled, readOnly, value, defaultValue, onValueChange, placeholder = '검색해서 선택하세요', emptyText = '일치하는 항목이 없어요.', openLabel = '목록 열기', selectedLabel = '선택한 항목', removeLabel = item => `${item} 제거`, chipDescription = 'Backspace 또는 Delete 키로 제거', inputDescription = count => `${count}개 선택됨. 입력 시작점에서 왼쪽 화살표 키를 누르면 선택 항목으로 이동합니다.`, inputValue, defaultInputValue, onInputValueChange, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    useHdsFocusGuardLabels();
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const items = BaseCombobox.createItems(options, { getValue: option => option.value, getLabel: option => option.label });
    const [query, setQuery] = useState(defaultInputValue ?? '');
    const selected = useResettableValue(value, defaultValue ?? [], form, undefined, () => {
        if (inputValue === undefined)
            setQuery(defaultInputValue ?? '');
    });
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsxs(BaseCombobox.Root, { items: items, multiple: true, name: name, form: form, required: required, disabled: disabled, readOnly: readOnly, value: selected.current, inputRef: selected.inputRef, onValueChange: next => { onValueChange?.(next); selected.change(next); }, inputValue: inputValue !== undefined ? inputValue : query, onInputValueChange: next => { onInputValueChange?.(next); if (inputValue === undefined)
                setQuery(next); }, children: [_jsxs(BaseCombobox.InputGroup, { className: `hds-field__inputGroup hds-field__multiGroup${className ? ` ${className}` : ''}`, children: [_jsx(BaseCombobox.Value, { children: (selected) => _jsxs(BaseCombobox.Chips, { className: "hds-field__chips", "aria-label": selected.length ? selectedLabel : undefined, children: [selected.map(item => { const itemLabel = options.find(option => option.value === item)?.label ?? item; return _jsxs(BaseCombobox.Chip, { role: "group", className: "hds-field__chip", "aria-label": itemLabel, "aria-description": chipDescription, children: [itemLabel, _jsx(BaseCombobox.ChipRemove, { className: "hds-field__chipRemove", "aria-label": removeLabel(itemLabel), disabled: disabled || readOnly, children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }, item); }), _jsx(BaseCombobox.Input, { ref: ref, id: inputId, placeholder: selected.length ? '' : placeholder, className: "hds-field__comboInput hds-field__multiInput", "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid, "aria-description": selected.length ? inputDescription(selected.length) : undefined })] }) }), _jsx(BaseCombobox.Trigger, { className: "hds-field__iconButton", "aria-label": openLabel, disabled: disabled || readOnly, children: _jsx(FieldChevron, {}) })] }), _jsx(BaseCombobox.Portal, { children: _jsx(BaseCombobox.Positioner, { sideOffset: 4, "data-hds-size": resolvedSize, className: "hds-field__positioner", children: _jsxs(BaseCombobox.Popup, { className: "hds-field__popup", children: [_jsx(BaseCombobox.Empty, { className: "hds-field__empty", children: emptyText }), _jsx(BaseCombobox.List, { className: "hds-field__list", children: (option) => _jsxs(BaseCombobox.Item, { value: option.value, disabled: option.disabled, className: "hds-field__option", children: [_jsx("span", { children: option.label }), _jsx(BaseCombobox.ItemIndicator, { "aria-hidden": "true", children: "\u2713" })] }, option.value) })] }) }) })] }) });
}
export function Switch({ label, hint, error, size, id, name, form, value, uncheckedValue, required, disabled, readOnly, checked, defaultChecked, onCheckedChange, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const selection = useResettableValue(checked, defaultChecked ?? false, form, ref);
    useLayoutEffect(() => {
        if (selection.input && checked !== undefined)
            selection.input.defaultChecked = checked;
    }, [selection.input, checked]);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, labelNode: _jsx("span", { className: "hds-field__label", children: label }), children: _jsx(BaseSwitch.Root, { id: inputId, inputRef: selection.inputRef, name: name, form: form, value: value, uncheckedValue: uncheckedValue, required: required, disabled: disabled, readOnly: readOnly, checked: selection.current, onCheckedChange: next => { onCheckedChange?.(next); selection.change(next); }, className: `hds-field__switch${className ? ` ${className}` : ''}`, "aria-label": label, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid, children: _jsx(BaseSwitch.Thumb, { className: "hds-field__switchThumb" }) }) });
}
export function RadioGroup({ label, hint, error, size, options, name, form, required, disabled, readOnly, value, defaultValue, onValueChange, ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    const generatedId = useId();
    const { hintId, errorId } = ids(generatedId, hint, error);
    const selection = useResettableValue(value, defaultValue ?? null, form, ref);
    useLayoutEffect(() => {
        if (!selection.input || value === undefined)
            return;
        // The browser resets Base UI's native radio inputs from defaultChecked.
        // Keep each default aligned with the caller-owned selection.
        const group = selection.input.closest('[role="radiogroup"]');
        for (const input of Array.from(group?.querySelectorAll('input[type="radio"]') ?? [])) {
            input.defaultChecked = input.value === value;
        }
    }, [selection.input, value, options]);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: generatedId, labelNode: _jsx("span", { className: "hds-field__label", id: `${generatedId}-label`, children: label }), children: _jsx(BaseRadioGroup, { value: selection.current, onValueChange: next => { if (next !== null)
                onValueChange?.(next); selection.change(next); }, name: name, form: form, required: required, disabled: disabled, readOnly: readOnly, inputRef: selection.inputRef, className: `hds-field__radioGroup${className ? ` ${className}` : ''}`, "aria-labelledby": `${generatedId}-label`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid, children: options.map(option => _jsxs("label", { className: "hds-field__radioOption", children: [_jsx(BaseRadio.Root, { value: option.value, disabled: option.disabled, className: "hds-field__radio", children: _jsx(BaseRadio.Indicator, { className: "hds-field__radioIndicator" }) }), _jsx("span", { children: option.label })] }, option.value)) }) });
}
export function Slider({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsx("input", { ...props, size: inputSize, ref: ref, id: inputId, type: "range", disabled: disabled, className: `hds-field__slider${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }) });
}
export function NumberField({ label, hint, error, size, id, name, form, required, disabled, readOnly, value, defaultValue, onValueChange, min, max, step, locale, placeholder, incrementLabel = '값 증가', decrementLabel = '값 감소', ref, className, 'aria-describedby': describedBy, 'aria-invalid': invalid }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const rootRef = useRef(null);
    const visibleRef = useRef(null);
    const focusTarget = useRef(null);
    const [resetKey, bumpResetKey] = useReducer((count) => count + 1, 0);
    const visibleInputRef = useCallback((node) => {
        visibleRef.current = node;
        const cleanup = assignInputRef(ref, node);
        if (node)
            return () => {
                if (visibleRef.current === node)
                    visibleRef.current = null;
                if (typeof cleanup === 'function')
                    cleanup();
                else
                    assignInputRef(ref, null);
            };
    }, [ref]);
    const number = useResettableValue(value, defaultValue ?? null, form, undefined, () => {
        const root = rootRef.current;
        const active = root?.ownerDocument.activeElement;
        focusTarget.current = active === visibleRef.current ? -1 : active && root?.contains(active)
            ? Array.from(root.querySelectorAll('button')).indexOf(active)
            : null;
        // Base UI 1.9 keeps a separate editable string buffer. It has no reset API;
        // a new root reconstructs that buffer from the accepted reset value.
        bumpResetKey();
    });
    useLayoutEffect(() => {
        if (focusTarget.current === null)
            return;
        const target = focusTarget.current === -1 ? visibleRef.current : rootRef.current?.querySelectorAll('button')[focusTarget.current];
        focusTarget.current = null;
        target?.focus();
    }, [resetKey]);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsx(BaseNumberField.Root, { ref: rootRef, id: inputId, name: name, form: form, required: required, disabled: disabled, readOnly: readOnly, value: number.current, inputRef: number.inputRef, onValueChange: next => { onValueChange?.(next); number.change(next); }, min: min, max: max, step: step, locale: locale, children: _jsxs(BaseNumberField.Group, { className: "hds-field__numberGroup", children: [_jsx(BaseNumberField.Input, { ref: visibleInputRef, id: inputId, placeholder: placeholder, className: `hds-field__control hds-field__numberInput${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }), _jsx(BaseNumberField.Decrement, { className: "hds-field__stepper", "aria-label": decrementLabel, children: _jsx("span", { "aria-hidden": "true", children: "\u2212" }) }), _jsx(BaseNumberField.Increment, { className: "hds-field__stepper", "aria-label": incrementLabel, children: _jsx("span", { "aria-hidden": "true", children: "+" }) })] }) }, resetKey) });
}
export function DateField({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsx("input", { ...props, size: inputSize, ref: ref, id: inputId, type: "date", disabled: disabled, className: `hds-field__control${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }) });
}
export function FileInput({ label, hint, error, size, inputSize, id, disabled, className, ref, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsx("input", { ...props, size: inputSize, ref: ref, id: inputId, type: "file", disabled: disabled, className: `hds-field__control hds-field__file${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }) });
}
export function PasswordField({ label, hint, error, size, inputSize, id, disabled, className, ref, showLabel = '비밀번호 표시', hideLabel = '비밀번호 숨기기', 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const { hintId, errorId } = ids(generatedId, hint, error);
    const [visible, setVisible] = useState(false);
    const resolvedSize = useHdsSize(size);
    return _jsx(FieldShell, { label, hint, error, hintId, errorId, disabled, size: resolvedSize, id: inputId, children: _jsxs("div", { className: "hds-field__passwordGroup", children: [_jsx("input", { ...props, size: inputSize, ref: ref, id: inputId, type: visible ? 'text' : 'password', disabled: disabled, className: `hds-field__control hds-field__passwordInput${className ? ` ${className}` : ''}`, "aria-describedby": description({ hintId, errorId, describedBy }), "aria-invalid": error ? true : invalid }), _jsx("button", { type: "button", className: "hds-field__passwordToggle", disabled: disabled, "aria-label": visible ? hideLabel : showLabel, "aria-pressed": visible, onClick: () => setVisible(previous => !previous), children: visible ? hideLabel : showLabel })] }) });
}
