export function isIPadOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isOldIPad = ua.includes('iPad');
  const isNewIPad = /Mac/.test(ua) && navigator.maxTouchPoints > 1;
  return isOldIPad || isNewIPad;
}
