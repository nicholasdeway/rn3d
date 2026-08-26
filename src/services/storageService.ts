import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';

const BUCKET_NAME = 'rn3d_attachments';

/**
 * Converte uma string Base64 em Blob para upload no Supabase Storage
 */
function base64ToBlob(base64Data: string): { blob: Blob; contentType: string; extension: string } {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].replace('data:', '') || 'image/jpeg';
  const byteCharacters = atob(parts[1]);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  const blob = new Blob(byteArrays, { type: contentType });
  let extension = 'jpg';
  if (contentType.includes('png')) extension = 'png';
  else if (contentType.includes('pdf')) extension = 'pdf';
  else if (contentType.includes('webp')) extension = 'webp';

  return { blob, contentType, extension };
}

/**
 * Envia um arquivo ou string Base64 para o Supabase Storage e retorna a URL pública.
 * Se o Supabase não estiver configurado ou o upload falhar, retorna uma versão compactada.
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

  // Tenta compactar/otimizar imagem Base64 mantendo alta definição para comprovantes
  let preparedBase64 = fileOrBase64;
  if (fileOrBase64.startsWith('data:image/')) {
    try {
      if (folder === 'receipts') {
        // Preserva nitidez e alta definição (1920px max, qualidade 0.92) para leitura clara de números e textos de comprovantes
        preparedBase64 = await compressImage(fileOrBase64, 1920, 1920, 0.92);
      } else {
        preparedBase64 = await compressImage(fileOrBase64, 600, 600, 0.82);
      }
    } catch (e) {
      // Ignora erro de compressão
    }
  }

  if (!isSupabaseConfigured()) {
    // Se o Supabase não está configurado, não envia para o storage
    return preparedBase64.length > 50000 ? '' : preparedBase64;
  }

  try {
    const { blob, contentType, extension } = base64ToBlob(preparedBase64);
    const sanitizedPrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${folder}/${sanitizedPrefix}_${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        contentType,
        cacheControl: '36000',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Storage] Não foi possível enviar para o bucket '${BUCKET_NAME}':`, uploadError.message);
      // Se o upload falhou (ex: bucket não existe), retorna a versão compactada ultraleve
      return preparedBase64.length > 50000 ? '' : preparedBase64;
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error('[Storage] Erro ao processar upload:', err?.message || err);
    return preparedBase64.length > 50000 ? '' : preparedBase64;
  }
}
