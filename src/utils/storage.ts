/**
 * Utilitários de Persistência e Higienização de Dados LocalStorage
 * RN 3D Soluções
 */

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    // Strips huge base64 image payloads before writing to local browser cache (5MB limit)
    let payloadToSave = value;
    if (key === 'rn3d_products' && value.includes('data:image/')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item: any) => {
            if (typeof item.imageUrl === 'string' && item.imageUrl.length > 30000) {
              return { ...item, imageUrl: '' };
            }
            return item;
          });
          payloadToSave = JSON.stringify(sanitized);
        }
      } catch (e) {}
    }

    localStorage.setItem(key, payloadToSave);
  } catch (e: any) {
    try {
      // Clear legacy temporary keys if quota is tight
      localStorage.removeItem('rn3d_client_logistics');
      localStorage.removeItem('rn3d_movements');
      localStorage.removeItem('rn3d_current_view');

      // Strip image URLs if still failing
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.map((item: any) => ({
          ...item,
          imageUrl: typeof item.imageUrl === 'string' && item.imageUrl.length > 1000 ? '' : item.imageUrl,
        }));
        localStorage.setItem(key, JSON.stringify(sanitized));
      }
    } catch (finalErr) {
      // Silent fallback: state remains 100% active in React memory and Supabase
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
