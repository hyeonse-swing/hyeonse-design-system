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
export function validatePreferences(value) {
    const input = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
    return {
        theme: options.theme.includes(input.theme) ? input.theme : defaultPreferences.theme,
        accent: options.accent.includes(input.accent) ? input.accent : defaultPreferences.accent,
        density: options.density.includes(input.density) ? input.density : defaultPreferences.density,
        corners: options.corners.includes(input.corners) ? input.corners : defaultPreferences.corners,
        motion: options.motion.includes(input.motion) ? input.motion : defaultPreferences.motion,
    };
}
export function parsePreferences(raw) {
    if (!raw)
        return { ...defaultPreferences };
    try {
        return validatePreferences(JSON.parse(raw));
    }
    catch {
        return { ...defaultPreferences };
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
export function createPreferenceScript(storageKey = preferencesKey) {
    // A JSON string literal is used inside an inline script; escape HTML syntax too.
    const safeKey = JSON.stringify(storageKey).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
    return `(function(){
  var defaults={theme:'system',accent:'cobalt',density:'comfortable',corners:'crisp',motion:'full'};
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
