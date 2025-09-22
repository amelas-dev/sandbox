const loadedFamilies = new Set<string>();

function formatFamilyForUrl(family: string): string {
  return family.trim().replace(/\s+/g, '+');
}

export function ensureGoogleFontsLoaded(families: ReadonlyArray<string>): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const pending = families.filter((family) => {
    if (!family) {
      return false;
    }
    if (loadedFamilies.has(family)) {
      return false;
    }
    loadedFamilies.add(family);
    return true;
  });

  if (!pending.length) {
    return;
  }

  const params = pending
    .map((family) => `family=${formatFamilyForUrl(family)}:wght@400;700`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-loaded-google-fonts', pending.join(','));
  document.head.appendChild(link);
}
