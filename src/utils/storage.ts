/**
 * Utilitários de Persistência e Higienização de Dados LocalStorage
 * RN 3D Soluções
 */

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    console.warn(`[LocalStorage Quota Warning] Exceeded storage quota for ${key}. Clearing secondary caches...`);
    try {
      localStorage.removeItem('rn3d_client_logistics');
      localStorage.removeItem('rn3d_movements');
      localStorage.removeItem('rn3d_transactions');
      localStorage.removeItem('rn3d_visits');
      localStorage.removeItem('rn3d_current_view');
      localStorage.setItem(key, value);
    } catch (err) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item: any) => {
            const copy = { ...item };
            if (typeof copy.imageUrl === 'string' && copy.imageUrl.length > 500000) copy.imageUrl = '';
            return copy;
          });
          localStorage.setItem(key, JSON.stringify(sanitized));
        }
      } catch (finalErr) {
        console.warn(`[LocalStorage Cache Warning] Storage limit reached for ${key}. State kept in memory.`);
      }
    }
  }
}

export function isSampleMockItem(item: any): boolean {
  if (!item) return false;
  const id = String(item.id || '');
  const name = String(item.name || item.clientName || '').toLowerCase();
  return (
    id === 'cli-1' ||
    id === 'cli-2' ||
    id === 'cli-3' ||
    id === 'cli-4' ||
    id === 'cli-5' ||
    id === 'cli-6' ||
    id === 'REM-000041' ||
    id === 'REM-000040' ||
    id === 'VIS-000052' ||
    id === 'VIS-000051' ||
    id === 'VIS-000050' ||
    id === 'TRC-000014' ||
    id === 'ORC-000034' ||
    id === 'ORC-000033' ||
    id === 'ORC-920984' ||
    id === 'PED-000081' ||
    id === 'PED-000080' ||
    id === 'PED-817946' ||
    id === 'sal-1' ||
    id === 'sal-2' ||
    id === 'sal-3' ||
    id === 'mov-1' ||
    id === 'mov-2' ||
    id === 'mov-3' ||
    id === 'mov-4' ||
    name.includes('depósito avenida') ||
    name.includes('bar do joão') ||
    name.includes('adega imperial') ||
    name.includes('conveniência central') ||
    name.includes('empresa abc')
  );
}

export function getStorageParsed<T>(key: string, fallback: T, filterMock = false): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (filterMock) {
          return parsed.filter((item) => !isSampleMockItem(item)) as unknown as T;
        }
        return parsed as unknown as T;
      }
      if (parsed && typeof parsed === 'object') {
        return parsed as T;
      }
    }
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
  }
  return fallback;
}
