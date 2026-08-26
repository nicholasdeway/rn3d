/**
 * Utilitários de Persistência e Higienização de Dados
 * RN 3D Soluções
 */

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    // Silent fallback
  }
}

export function isSampleMockItem(item: any): boolean {
  return false;
}

export function getStorageParsed<T>(key: string, fallback: T, filterMock = false): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
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
