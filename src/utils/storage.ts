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

export function safeGetLocalStorage(key: string): string | null {
  try {
    if (storageAvailable) {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (e) {
    console.warn(`[Storage] Leitura da chave "${key}" via localStorage falhou, buscando em memória fallback:`, e);
  }
  return memoryStorage.get(key) ?? null;
}

export function safeSetLocalStorage(key: string, value: string): void {
  // Atualiza sempre o cache em memória
  memoryStorage.set(key, value);

  try {
    if (storageAvailable) {
      localStorage.setItem(key, value);
    }
  } catch (e: any) {
    console.warn(`[Storage] Gravação da chave "${key}" via localStorage falhou (Fallback ativo):`, e?.message || e);
    // Se estourar a cota de 5MB (QuotaExceededError), tenta liberar espaço limpando itens secundários
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      try {
        localStorage.removeItem('rn3d_expenses_cache');
        localStorage.removeItem('rn3d_client_logistics');
        localStorage.setItem(key, value);
      } catch (retryErr) {
        // Se ainda falhar, mantemos com segurança o valor no memoryStorage
      }
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

