'use client';

import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  effectiveMotion, parsePreferences, preferencesKey,
  resolvedTheme, serializePreferences, validatePreferences,
} from './preferences.js';
import type { Preferences, ThemePreference } from './preferences.js';
export type Locale = 'ko' | 'en';
const defaultEventName = 'hyeonse:preferences';

type PreferenceContext = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetPreferences: () => void;
};

const Context = createContext<PreferenceContext | null>(null);

function applyPreferences(preferences: Preferences, eventName: string) {
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

function readPreferences(storageKey: string, defaults: Preferences): Preferences {
  try { return parsePreferences(window.localStorage.getItem(storageKey), defaults); }
  catch { return { ...defaults }; }
}

export function PreferencesProvider({ children, storageKey = preferencesKey, eventName = defaultEventName, defaults }: {
  children: ReactNode; storageKey?: string; eventName?: string; defaults?: Partial<Preferences>;
}) {
  const resolvedDefaults = useMemo(() => validatePreferences(null, defaults), [
    defaults?.theme, defaults?.accent, defaults?.density, defaults?.corners, defaults?.motion,
  ]);
  const [preferences, setPreferences] = useState<Preferences>(resolvedDefaults);
  const preferencesRef = useRef<Preferences>(resolvedDefaults);

  useLayoutEffect(() => {
    const stored = readPreferences(storageKey, resolvedDefaults);
    preferencesRef.current = stored;
    setPreferences(stored);
    applyPreferences(stored, eventName);

    const themeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onSystemChange = () => applyPreferences(preferencesRef.current, eventName);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const next = readPreferences(storageKey, resolvedDefaults);
      preferencesRef.current = next;
      setPreferences(next);
      applyPreferences(next, eventName);
    };
    themeQuery?.addEventListener('change', onSystemChange);
    motionQuery?.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      themeQuery?.removeEventListener('change', onSystemChange);
      motionQuery?.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [storageKey, eventName, resolvedDefaults]);

  const save = useCallback((next: Preferences) => {
    const safe = validatePreferences(next, resolvedDefaults);
    preferencesRef.current = safe;
    setPreferences(safe);
    try { window.localStorage.setItem(storageKey, serializePreferences(safe)); }
    catch { /* Settings still work for this tab when storage is unavailable. */ }
    applyPreferences(safe, eventName);
  }, [storageKey, eventName, resolvedDefaults]);

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    save({ ...preferencesRef.current, [key]: value });
  }, [save]);

  const resetPreferences = useCallback(() => save({ ...resolvedDefaults }), [save, resolvedDefaults]);

  return <Context.Provider value={{ preferences, setPreference, resetPreferences }}>{children}</Context.Provider>;
}

export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error('PreferencesProvider가 필요합니다.');
  return context;
}

const themeOptions: Record<Locale, { value: ThemePreference; label: string }[]> = {
  ko: [{ value: 'system', label: '기기 설정' }, { value: 'light', label: '밝게' }, { value: 'dark', label: '어둡게' }],
  en: [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }],
};

export function ThemeToggle({ locale = 'ko' }: { locale?: Locale }) {
  const { preferences, setPreference } = usePreferences();
  const options = themeOptions[locale];
  const current = options.find(option => option.value === preferences.theme)!;
  const next = options[(options.findIndex(option => option.value === preferences.theme) + 1) % options.length]!;
  return <button
    type="button"
    className={'hds-themeToggle'}
    onClick={() => setPreference('theme', next.value)}
    aria-label={locale === 'ko' ? `현재 테마 ${current.label}. ${next.label} 모드로 변경` : `Current theme: ${current.label}. Switch to ${next.label} mode`}
    title={locale === 'ko' ? `현재 ${current.label} · 다음 ${next.label}` : `Current: ${current.label} · Next: ${next.label}`}
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {preferences.theme === 'system' && <><rect x="3" y="4" width="18" height="13" rx="1" /><path d="M8 21h8M12 17v4" /></>}
      {preferences.theme === 'light' && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" /></>}
      {preferences.theme === 'dark' && <path d="M20.3 15.7A8.5 8.5 0 0 1 8.3 3.7a8.5 8.5 0 1 0 12 12Z" />}
    </svg>
    <span aria-hidden="true">{current.label}</span>
  </button>;
}

type Choice<K extends keyof Preferences> = { value: Preferences[K]; label: string };

function RadioGroup<K extends 'theme' | 'density' | 'corners' | 'motion'>({
  field, legend, choices, name, description,
}: { field: K; legend: string; choices: Choice<K>[]; name: string; description?: string }) {
  const { preferences, setPreference } = usePreferences();
  return <fieldset className={'hds-group'} aria-describedby={description ? `${name}-${field}-description` : undefined}>
    <legend>{legend}</legend>
    <div className={'hds-options'}>
      {choices.map(choice => <label className={'hds-radioOption'} key={choice.value}>
        <input type="radio" name={`${name}-${field}`} value={choice.value} checked={preferences[field] === choice.value} onChange={() => setPreference(field, choice.value)} />
        <span>{choice.label}</span>
      </label>)}
    </div>
    {description && <p id={`${name}-${field}-description`}>{description}</p>}
  </fieldset>;
}

export function PreferencesPanel({ locale = 'ko' }: { locale?: Locale }) {
  const { preferences, setPreference, resetPreferences } = usePreferences();
  const panelId = useId();
  const en = locale === 'en';
  const accentOptions = en
    ? [{ value: 'cobalt', label: 'Cobalt' }, { value: 'forest', label: 'Forest' }, { value: 'coral', label: 'Coral' }] as const
    : [{ value: 'cobalt', label: '코발트' }, { value: 'forest', label: '포레스트' }, { value: 'coral', label: '코랄' }] as const;
  return <section className={'hds-panel'} aria-labelledby={`${panelId}-title`}>
    <div className={'hds-heading'}><div><span className={'hds-kicker'}>DISPLAY / CONTROL</span><h2 id={`${panelId}-title`}>{en ? 'Display settings' : '화면 설정'}</h2></div><p>{en ? 'Adjust the display for comfortable reading.' : '읽기 편한 화면으로 바꿔 보세요.'}</p></div>
    <div className={'hds-groups'}>
      <RadioGroup field="theme" legend={en ? 'Theme' : '테마'} choices={themeOptions[locale]} name={panelId} />
      <fieldset className={'hds-group'}>
        <legend>{en ? 'Accent color' : '강조 색상'}</legend>
        <div className={'hds-accents'}>
          {accentOptions.map(({ value, label }) => <button type="button" key={value} className={`${'hds-accentButton'} ${`hds-${value}`}`} aria-pressed={preferences.accent === value} aria-label={en ? `${label} accent color${preferences.accent === value ? ', selected' : ''}` : `${label} 강조 색상${preferences.accent === value ? ', 선택됨' : ''}`} onClick={() => setPreference('accent', value)}><span className={'hds-swatch'} aria-hidden="true">{preferences.accent === value ? '✓' : ''}</span><span>{label}</span></button>)}
        </div>
      </fieldset>
      <RadioGroup field="density" legend={en ? 'Spacing' : '간격'} choices={en ? [{ value: 'comfortable', label: 'Default' }, { value: 'compact', label: 'Compact' }] : [{ value: 'comfortable', label: '기본' }, { value: 'compact', label: '촘촘하게' }]} name={panelId} />
      <RadioGroup field="corners" legend={en ? 'Corners' : '모서리'} choices={en ? [{ value: 'crisp', label: 'Sharp' }, { value: 'soft', label: 'Rounded' }] : [{ value: 'crisp', label: '각지게' }, { value: 'soft', label: '부드럽게' }]} name={panelId} />
      <RadioGroup field="motion" legend={en ? 'Motion' : '움직임'} choices={en ? [{ value: 'full', label: 'Default' }, { value: 'reduced', label: 'Reduced' }] : [{ value: 'full', label: '기본' }, { value: 'reduced', label: '줄이기' }]} name={panelId} description={en ? 'Your device’s reduced motion setting takes priority.' : '기기의 움직임 줄이기 설정이 선택한 값보다 우선 적용됩니다.'} />
    </div>
    <div className={'hds-footer'}><p role="status" aria-live="polite">{en ? 'Current settings: ' : '현재 설정: '}{themeOptions[locale].find(option => option.value === preferences.theme)?.label}, {accentOptions.find(option => option.value === preferences.accent)?.label}, {en ? (preferences.density === 'compact' ? 'compact spacing' : 'default spacing') : (preferences.density === 'compact' ? '촘촘한 간격' : '기본 간격')}, {en ? (preferences.corners === 'soft' ? 'rounded corners' : 'sharp corners') : (preferences.corners === 'soft' ? '부드러운 모서리' : '각진 모서리')}, {en ? (preferences.motion === 'reduced' ? 'reduced motion' : 'default motion') : (preferences.motion === 'reduced' ? '움직임 줄이기' : '기본 움직임')}</p><button type="button" onClick={resetPreferences}>{en ? 'Reset to defaults' : '기본값으로 되돌리기'}</button></div>
  </section>;
}
