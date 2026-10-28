export type ThemePreference = 'system' | 'light' | 'dark';
export type AccentPreference = 'cobalt' | 'forest' | 'coral';
export type DensityPreference = 'comfortable' | 'compact';
export type CornersPreference = 'crisp' | 'soft';
export type MotionPreference = 'full' | 'reduced';

export type Preferences = {
  theme: ThemePreference;
  accent: AccentPreference;
  density: DensityPreference;
  corners: CornersPreference;
  motion: MotionPreference;
};

export const preferencesKey = 'hyeonse-site-preferences';
export const defaultPreferences: Preferences = {
  theme: 'system',
  accent: 'cobalt',
  density: 'comfortable',
  corners: 'crisp',
  motion: 'full',
};

const options = {
  theme: ['system', 'light', 'dark'],
  accent: ['cobalt', 'forest', 'coral'],
  density: ['comfortable', 'compact'],
  corners: ['crisp', 'soft'],
  motion: ['full', 'reduced'],
} as const;

export function validatePreferences(value: unknown, defaults?: Partial<Preferences>): Preferences {
  const input = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const fallback = {
    theme: options.theme.includes(defaults?.theme as ThemePreference) ? defaults!.theme! : defaultPreferences.theme,
    accent: options.accent.includes(defaults?.accent as AccentPreference) ? defaults!.accent! : defaultPreferences.accent,
    density: options.density.includes(defaults?.density as DensityPreference) ? defaults!.density! : defaultPreferences.density,
    corners: options.corners.includes(defaults?.corners as CornersPreference) ? defaults!.corners! : defaultPreferences.corners,
    motion: options.motion.includes(defaults?.motion as MotionPreference) ? defaults!.motion! : defaultPreferences.motion,
  };
  return {
    theme: options.theme.includes(input.theme as ThemePreference) ? input.theme as ThemePreference : fallback.theme,
    accent: options.accent.includes(input.accent as AccentPreference) ? input.accent as AccentPreference : fallback.accent,
    density: options.density.includes(input.density as DensityPreference) ? input.density as DensityPreference : fallback.density,
    corners: options.corners.includes(input.corners as CornersPreference) ? input.corners as CornersPreference : fallback.corners,
    motion: options.motion.includes(input.motion as MotionPreference) ? input.motion as MotionPreference : fallback.motion,
  };
}

export function parsePreferences(raw: string | null, defaults?: Partial<Preferences>): Preferences {
  if (!raw) return validatePreferences(null, defaults);
  try { return validatePreferences(JSON.parse(raw), defaults); }
  catch { return validatePreferences(null, defaults); }
}

export function serializePreferences(value: Preferences): string {
  return JSON.stringify(validatePreferences(value));
}

export function resolvedTheme(theme: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

export function effectiveMotion(motion: MotionPreference, systemReduced: boolean): MotionPreference {
  return systemReduced ? 'reduced' : motion;
}

// Root layout inserts this in <head> before CSS paints and suppresses hydration warnings on <html>.
export function createPreferenceScript(storageKey = preferencesKey, defaults?: Partial<Preferences>): string {
  // A JSON string literal is used inside an inline script; escape HTML syntax too.
  const safeKey = JSON.stringify(storageKey).replace(/[<>&\u2028\u2029]/g, character =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  const safeDefaults = JSON.stringify(validatePreferences(null, defaults)).replace(/[<>&\u2028\u2029]/g, character =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return `(function(){
  var defaults=${safeDefaults};
  var allowed={theme:['system','light','dark'],accent:['cobalt','forest','coral'],density:['comfortable','compact'],corners:['crisp','soft'],motion:['full','reduced']};
  var stored={};
  try { var value=JSON.parse(localStorage.getItem(${safeKey})||'{}'); if(value&&typeof value==='object'&&!Array.isArray(value))stored=value; } catch(e) {}
  var p={};
  for(var key in defaults)p[key]=allowed[key].includes(stored[key])?stored[key]:defaults[key];
  var dark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root=document.documentElement;
  root.dataset.theme=p.theme==='system'?(dark?'dark':'light'):p.theme;
  root.dataset.themePreference=p.theme;
  root.dataset.accent=p.accent;
  root.dataset.density=p.density;
  root.dataset.corners=p.corners;
  root.dataset.motion=reduced?'reduced':p.motion;
})();`;
}

export const preferenceScript = createPreferenceScript();
