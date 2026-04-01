// Browser fingerprinting for anonymous vote deduplication
// Combines hardware signals with a persistent random ID so that
// incognito / new profiles get a fresh identity.
export async function getFingerprint(): Promise<string> {
  // Persistent random component — survives page reloads but NOT incognito / cleared storage
  let persistentId = localStorage.getItem('ea_device_id');
  if (!persistentId) {
    persistentId = crypto.randomUUID();
    localStorage.setItem('ea_device_id', persistentId);
  }

  const components = [
    persistentId,
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || '',
    navigator.platform || '',
  ];

  const raw = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
