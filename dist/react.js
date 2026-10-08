'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useId, useLayoutEffect, useRef, useState } from 'react';
import { defaultPreferences, effectiveMotion, parsePreferences, preferencesKey, resolvedTheme, serializePreferences, validatePreferences, } from './preferences.js';
const defaultEventName = 'hyeonse:preferences';
const Context = createContext(null);
function applyPreferences(preferences, eventName) {
    const root = document.documentElement;
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    root.dataset.theme = resolvedTheme(preferences.theme, dark);
    root.dataset.themePreference = preferences.theme;
    root.dataset.accent = preferences.accent;
    root.dataset.density = preferences.density;
    root.dataset.corners = preferences.corners;
    root.dataset.motion = effectiveMotion(preferences.motion, reduced);
    window.dispatchEvent(new CustomEvent(eventName, { detail: preferences }));
}
function readPreferences(storageKey) {
    try {
        return parsePreferences(window.localStorage.getItem(storageKey));
    }
    catch {
        return { ...defaultPreferences };
    }
}
export function PreferencesProvider({ children, storageKey = preferencesKey, eventName = defaultEventName }) {
    const [preferences, setPreferences] = useState(defaultPreferences);
    const preferencesRef = useRef(defaultPreferences);
    useLayoutEffect(() => {
        const stored = readPreferences(storageKey);
        preferencesRef.current = stored;
        setPreferences(stored);
        applyPreferences(stored, eventName);
        const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onSystemChange = () => applyPreferences(preferencesRef.current, eventName);
        const onStorage = (event) => {
            if (event.key !== storageKey && event.key !== null)
                return;
            const next = readPreferences(storageKey);
            preferencesRef.current = next;
            setPreferences(next);
            applyPreferences(next, eventName);
        };
        themeQuery.addEventListener('change', onSystemChange);
        motionQuery.addEventListener('change', onSystemChange);
        window.addEventListener('storage', onStorage);
        return () => {
            themeQuery.removeEventListener('change', onSystemChange);
            motionQuery.removeEventListener('change', onSystemChange);
            window.removeEventListener('storage', onStorage);
        };
    }, [storageKey, eventName]);
    const save = useCallback((next) => {
        const safe = validatePreferences(next);
        preferencesRef.current = safe;
        setPreferences(safe);
        applyPreferences(safe, eventName);
        try {
            window.localStorage.setItem(storageKey, serializePreferences(safe));
        }
        catch { /* Settings still work for this tab when storage is unavailable. */ }
    }, [storageKey, eventName]);
    const setPreference = useCallback((key, value) => {
        save({ ...preferencesRef.current, [key]: value });
    }, [save]);
    const resetPreferences = useCallback(() => save({ ...defaultPreferences }), [save]);
    return _jsx(Context.Provider, { value: { preferences, setPreference, resetPreferences }, children: children });
}
export function usePreferences() {
    const context = useContext(Context);
    if (!context)
        throw new Error('PreferencesProvider가 필요합니다.');
    return context;
}
const themeOptions = {
    ko: [{ value: 'system', label: '기기 설정' }, { value: 'light', label: '밝게' }, { value: 'dark', label: '어둡게' }],
    en: [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }],
};
export function ThemeToggle({ locale = 'ko' }) {
    const { preferences, setPreference } = usePreferences();
    const options = themeOptions[locale];
    const current = options.find(option => option.value === preferences.theme);
    const next = options[(options.findIndex(option => option.value === preferences.theme) + 1) % options.length];
    return _jsxs("button", { type: "button", className: 'hds-themeToggle', onClick: () => setPreference('theme', next.value), "aria-label": locale === 'ko' ? `현재 테마 ${current.label}. ${next.label} 모드로 변경` : `Current theme: ${current.label}. Switch to ${next.label} mode`, title: locale === 'ko' ? `현재 ${current.label} · 다음 ${next.label}` : `Current: ${current.label} · Next: ${next.label}`, children: [_jsxs("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", children: [preferences.theme === 'system' && _jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1" }), _jsx("path", { d: "M8 21h8M12 17v4" })] }), preferences.theme === 'light' && _jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" })] }), preferences.theme === 'dark' && _jsx("path", { d: "M20.3 15.7A8.5 8.5 0 0 1 8.3 3.7a8.5 8.5 0 1 0 12 12Z" })] }), _jsx("span", { "aria-hidden": "true", children: current.label })] });
}
function RadioGroup({ field, legend, choices, name, }) {
    const { preferences, setPreference } = usePreferences();
    return _jsxs("fieldset", { className: 'hds-group', children: [_jsx("legend", { children: legend }), _jsx("div", { className: 'hds-options', children: choices.map(choice => _jsxs("label", { className: 'hds-radioOption', children: [_jsx("input", { type: "radio", name: `${name}-${field}`, value: choice.value, checked: preferences[field] === choice.value, onChange: () => setPreference(field, choice.value) }), _jsx("span", { children: choice.label })] }, choice.value)) })] });
}
export function PreferencesPanel({ locale = 'ko' }) {
    const { preferences, setPreference, resetPreferences } = usePreferences();
    const panelId = useId();
    const en = locale === 'en';
    const accentOptions = en
        ? [{ value: 'cobalt', label: 'Cobalt' }, { value: 'forest', label: 'Forest' }, { value: 'coral', label: 'Coral' }]
        : [{ value: 'cobalt', label: '코발트' }, { value: 'forest', label: '포레스트' }, { value: 'coral', label: '코랄' }];
    return _jsxs("section", { className: 'hds-panel', "aria-labelledby": `${panelId}-title`, children: [_jsxs("div", { className: 'hds-heading', children: [_jsxs("div", { children: [_jsx("span", { className: 'hds-kicker', children: "DISPLAY / CONTROL" }), _jsx("h2", { id: `${panelId}-title`, children: en ? 'Display settings' : '화면 설정' })] }), _jsx("p", { children: en ? 'Adjust the display for comfortable reading.' : '읽기 편한 화면으로 바꿔 보세요.' })] }), _jsxs("div", { className: 'hds-groups', children: [_jsx(RadioGroup, { field: "theme", legend: en ? 'Theme' : '테마', choices: themeOptions[locale], name: panelId }), _jsxs("fieldset", { className: 'hds-group', children: [_jsx("legend", { children: en ? 'Accent color' : '강조 색상' }), _jsx("div", { className: 'hds-accents', children: accentOptions.map(({ value, label }) => _jsxs("button", { type: "button", className: `${'hds-accentButton'} ${`hds-${value}`}`, "aria-pressed": preferences.accent === value, "aria-label": en ? `${label} accent color${preferences.accent === value ? ', selected' : ''}` : `${label} 강조 색상${preferences.accent === value ? ', 선택됨' : ''}`, onClick: () => setPreference('accent', value), children: [_jsx("span", { className: 'hds-swatch', "aria-hidden": "true", children: preferences.accent === value ? '✓' : '' }), _jsx("span", { children: label })] }, value)) })] }), _jsx(RadioGroup, { field: "density", legend: en ? 'Spacing' : '간격', choices: en ? [{ value: 'comfortable', label: 'Default' }, { value: 'compact', label: 'Compact' }] : [{ value: 'comfortable', label: '기본' }, { value: 'compact', label: '촘촘하게' }], name: panelId }), _jsx(RadioGroup, { field: "corners", legend: en ? 'Corners' : '모서리', choices: en ? [{ value: 'crisp', label: 'Sharp' }, { value: 'soft', label: 'Rounded' }] : [{ value: 'crisp', label: '각지게' }, { value: 'soft', label: '부드럽게' }], name: panelId }), _jsx(RadioGroup, { field: "motion", legend: en ? 'Motion' : '움직임', choices: en ? [{ value: 'full', label: 'Default' }, { value: 'reduced', label: 'Reduced' }] : [{ value: 'full', label: '기본' }, { value: 'reduced', label: '줄이기' }], name: panelId })] }), _jsxs("div", { className: 'hds-footer', children: [_jsxs("p", { role: "status", "aria-live": "polite", children: [en ? 'Current settings: ' : '현재 설정: ', themeOptions[locale].find(option => option.value === preferences.theme)?.label, ", ", accentOptions.find(option => option.value === preferences.accent)?.label, ", ", en ? (preferences.density === 'compact' ? 'compact spacing' : 'default spacing') : (preferences.density === 'compact' ? '촘촘한 간격' : '기본 간격'), ", ", en ? (preferences.corners === 'soft' ? 'rounded corners' : 'sharp corners') : (preferences.corners === 'soft' ? '부드러운 모서리' : '각진 모서리'), ", ", en ? (preferences.motion === 'reduced' ? 'reduced motion' : 'default motion') : (preferences.motion === 'reduced' ? '움직임 줄이기' : '기본 움직임')] }), _jsx("button", { type: "button", onClick: resetPreferences, children: en ? 'Reset to defaults' : '기본값으로 되돌리기' })] })] });
}
