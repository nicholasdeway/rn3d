/**
 * Utilitários de Persistência e Higienização de Dados com Fallback em Memória
 * RN 3D Soluções — Compatível 100% com Mobile (iOS Safari / WebViews / Android) e Web
 */

// Cache em memória para casos onde localStorage está desabilitado ou lançou exceção (ex: Safari Privado)
const memoryStorage = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__rn3d_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

// Limpeza automática de chaves legadas infladas que estouravam a cota de 5MB
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('rn3d_expenses');
    window.localStorage.removeItem('rn3d_expenses_cache');
  } catch (e) {}
}

function stripDataUrls(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(stripDataUrls);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const k of Object.keys(obj)) {
      const val = obj[k];
      if (typeof val === 'string' && val.startsWith('data:')) {
        cleaned[k] = '';
      } else {
        cleaned[k] = stripDataUrls(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export function safeGetLocalStorage(key: string): string | null {
  try {
    if (storageAvailable) {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (e) {}
  return memoryStorage.get(key) ?? null;
}

export function safeSetLocalStorage(key: string, value: string): void {
  // Atualiza sempre o cache em memória
  memoryStorage.set(key, value);

  // Não salva arrays de despesas nem dados inflados com Base64 no LocalStorage para não estourar a cota de 5MB
  if (key === 'rn3d_expenses' || key === 'rn3d_expenses_cache') {
    try {
      if (storageAvailable) localStorage.removeItem(key);
    } catch (e) {}
    return;
  }

  let valueToSave = value;
  if (value.includes('data:image/') || value.includes('data:application/pdf')) {
    try {
      const parsed = JSON.parse(value);
      valueToSave = JSON.stringify(stripDataUrls(parsed));
    } catch (e) {}
  }

  try {
    if (storageAvailable) {
      localStorage.setItem(key, valueToSave);
    }
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      try {
        localStorage.removeItem('rn3d_expenses_cache');
        localStorage.removeItem('rn3d_expenses');
        localStorage.removeItem('rn3d_client_logistics');
      } catch (retryErr) {}
    }
  }
}

export function safeRemoveLocalStorage(key: string): void {
  memoryStorage.delete(key);
  try {
    if (storageAvailable) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`[Storage] Remoção da chave "${key}" via localStorage falhou:`, e);
  }
}

export function isSampleMockItem(_item: any): boolean {
  return false;
}

export function getStorageParsed<T>(key: string, fallback: T, _filterMock = false): T {
  try {
    const saved = safeGetLocalStorage(key);
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
    console.error(`Error loading ${key} from storage:`, e);
  }
  return fallback;
}

