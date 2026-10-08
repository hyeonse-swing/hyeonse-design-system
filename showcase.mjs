import {
  defaultPreferences, effectiveMotion, parsePreferences, preferencesKey,
  resolvedTheme, serializePreferences, validatePreferences,
} from './dist/preferences.js';

const root = document.documentElement;
const form = document.getElementById('settings-form');
const current = document.getElementById('settings-current');
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function read() {
  try { return parsePreferences(localStorage.getItem(preferencesKey)); }
  catch { return { ...defaultPreferences }; }
}

let preferences = read();

function apply() {
  root.dataset.theme = resolvedTheme(preferences.theme, themeQuery.matches);
  root.dataset.themePreference = preferences.theme;
  root.dataset.accent = preferences.accent;
  root.dataset.density = preferences.density;
  root.dataset.corners = preferences.corners;
  root.dataset.motion = effectiveMotion(preferences.motion, motionQuery.matches);
  for (const [key, value] of Object.entries(preferences)) {
    const input = form.querySelector(`input[name="${key}"][value="${value}"]`);
    if (input) input.checked = true;
  }
  const labels = { theme: { system: '기기 설정', light: '밝게', dark: '어둡게' }, accent: { cobalt: '코발트', forest: '포레스트', coral: '코랄' } };
  current.textContent = `${labels.theme[preferences.theme]} · ${labels.accent[preferences.accent]} · ${preferences.density === 'compact' ? '촘촘한 간격' : '기본 간격'}`;
  document.getElementById('theme-toggle-label').textContent = labels.theme[preferences.theme];
  document.getElementById('theme-toggle-specimen').setAttribute('aria-label', `현재 테마 ${labels.theme[preferences.theme]}. 다음 모드로 변경`);
}

function save(next) {
  preferences = validatePreferences(next);
  apply();
  try { localStorage.setItem(preferencesKey, serializePreferences(preferences)); }
  catch { /* Controls still work in this tab. */ }
}

form.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  save({ ...preferences, [input.name]: input.value });
});
document.getElementById('reset-preferences').addEventListener('click', () => save(defaultPreferences));
document.getElementById('theme-toggle-specimen').addEventListener('click', () => {
  const themes = ['system', 'light', 'dark'];
  save({ ...preferences, theme: themes[(themes.indexOf(preferences.theme) + 1) % themes.length] });
});
document.getElementById('action-button').addEventListener('click', () => {
  document.getElementById('action-feedback').textContent = '동작 확인 완료 · 버튼이 활성화되어 있습니다.';
});
window.addEventListener('storage', event => {
  if (event.key !== preferencesKey && event.key !== null) return;
  preferences = read();
  apply();
});
themeQuery.addEventListener('change', apply);
motionQuery.addEventListener('change', apply);
apply();
