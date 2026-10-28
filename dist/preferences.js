export const preferencesKey = 'hyeonse-site-preferences';
export const defaultPreferences = {
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
};
export function validatePreferences(value, defaults) {
    const input = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
    const fallback = {
        theme: options.theme.includes(defaults?.theme) ? defaults.theme : defaultPreferences.theme,
        accent: options.accent.includes(defaults?.accent) ? defaults.accent : defaultPreferences.accent,
        density: options.density.includes(defaults?.density) ? defaults.density : defaultPreferences.density,
        corners: options.corners.includes(defaults?.corners) ? defaults.corners : defaultPreferences.corners,
        motion: options.motion.includes(defaults?.motion) ? defaults.motion : defaultPreferences.motion,
    };
    return {
        theme: options.theme.includes(input.theme) ? input.theme : fallback.theme,
        accent: options.accent.includes(input.accent) ? input.accent : fallback.accent,
        density: options.density.includes(input.density) ? input.density : fallback.density,
        corners: options.corners.includes(input.corners) ? input.corners : fallback.corners,
        motion: options.motion.includes(input.motion) ? input.motion : fallback.motion,
    };
}
export function parsePreferences(raw, defaults) {
    if (!raw)
        return validatePreferences(null, defaults);
    try {
        return validatePreferences(JSON.parse(raw), defaults);
    }
    catch {
        return validatePreferences(null, defaults);
    }
}
export function serializePreferences(value) {
    return JSON.stringify(validatePreferences(value));
}
export function resolvedTheme(theme, systemDark) {
    return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}
export function effectiveMotion(motion, systemReduced) {
    return systemReduced ? 'reduced' : motion;
}
// Root layout inserts this in <head> before CSS paints and suppresses hydration warnings on <html>.
export function createPreferenceScript(storageKey = preferencesKey, defaults) {
    // A JSON string literal is used inside an inline script; escape HTML syntax too.
    const safeKey = JSON.stringify(storageKey).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
    const safeDefaults = JSON.stringify(validatePreferences(null, defaults)).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
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
