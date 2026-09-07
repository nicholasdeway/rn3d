import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';

const BUCKET_NAME = 'rn3d_attachments';

/**
 * Converte uma string Base64 em Blob para upload no Supabase Storage
 */
function base64ToBlob(base64Data: string): { blob: Blob; contentType: string; extension: string } {
  try {
    const parts = base64Data.split(';base64,');
    if (parts.length < 2) {
      return { blob: new Blob([]), contentType: 'application/pdf', extension: 'pdf' };
    }
    let contentType = parts[0].replace('data:', '').trim();
    const cleanBase64 = parts[1].replace(/\s/g, '');
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    let extension = 'jpg';
    if (contentType.includes('pdf')) {
      extension = 'pdf';
      contentType = 'application/pdf';
    } else if (contentType.includes('png')) {
      extension = 'png';
      contentType = 'image/png';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
      contentType = 'image/webp';
    } else if (contentType.includes('svg')) {
      extension = 'svg';
      contentType = 'image/svg+xml';
    } else {
      contentType = 'image/jpeg';
      extension = 'jpg';
    }

    const blob = new Blob([byteNumbers], { type: contentType });
    return { blob, contentType, extension };
  } catch (e) {
    return { blob: new Blob([]), contentType: 'application/pdf', extension: 'pdf' };
  }
}

let storageBucketMissing = false;

/**
 * Envia um arquivo ou string Base64 para o Supabase Storage e retorna a URL pública.
 * Se o Supabase não estiver configurado ou ocorrer falha, retorna o DataURL (comprimido) como fallback.
 */
export async function uploadToSupabaseStorage(
  fileOrBase64: string,
  folder: 'receipts' | 'products' | 'clients',
  fileNamePrefix: string = 'file'
): Promise<string> {
  if (!fileOrBase64 || typeof fileOrBase64 !== 'string') {
    return '';
  }

  // Se já for uma URL externa ou nula, retorna direto
  if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
    return fileOrBase64;
  }

  // Se não for Base64, retorna como está
  if (!fileOrBase64.startsWith('data:')) {
    return fileOrBase64;
  }

  // Tenta compactar/otimizar imagem Base64 mantendo alta definição e legibilidade dos comprovantes
  let preparedBase64 = fileOrBase64;
  if (fileOrBase64.startsWith('data:image/')) {
    try {
      if (folder === 'receipts') {
        // Compressão para comprovantes: até 1600px com qualidade 0.8 (garante legibilidade de letras pequenas)
        preparedBase64 = await compressImage(fileOrBase64, 1600, 1600, 0.8);
      } else {
        preparedBase64 = await compressImage(fileOrBase64, 800, 800, 0.75);
      }
    } catch (e) {
      console.warn('[Storage] Falha ao comprimir imagem, usando original:', e);
    }
  }

  // Se o Supabase não estiver configurado, retorna o DataURL direto
  if (!isSupabaseConfigured()) {
    return preparedBase64;
  }

  try {
    const { blob, contentType, extension } = base64ToBlob(preparedBase64);
    if (blob.size === 0) {
      return preparedBase64;
    }

    const cleanPrefix = fileNamePrefix
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 25) || 'file';

    const uniqueTag = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `${folder}/${cleanPrefix}_${uniqueTag}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        contentType,
        cacheControl: '36000',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Storage] Upload no Supabase falhou (${uploadError.message}). Usando fallback local.`);
      return preparedBase64;
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return publicUrlData?.publicUrl || preparedBase64;
  } catch (err: any) {
    console.warn(`[Storage] Exceção no upload para Supabase:`, err);
    return preparedBase64;
  }
}
