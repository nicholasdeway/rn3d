-- ==============================================================================
-- RN 3D Manager - Script de Limpeza de Bloat de 40GB & Configuração do Storage
-- Execute este script no SQL Editor do Supabase (supabase.com -> SQL Editor)
-- ==============================================================================

-- 1. CRIAR BUCKET PÚBLICO NO SUPABASE STORAGE (PARA IMAGENS E COMPROVANTES)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rn3d_attachments',
  'rn3d_attachments',
  true,
  10485760, -- limite de 10MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas RLS para permitir leitura e envio no bucket de storage público
DROP POLICY IF EXISTS "Public Storage Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Select Access" ON storage.objects;

CREATE POLICY "Public Storage Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rn3d_attachments');

CREATE POLICY "Public Storage Select Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'rn3d_attachments');

-- 2. LIMPAR STRINGS BASE64 GIGANTES DAS COLUNAS DE TEXTO (LIBERA ESPAÇO NO POSTGRES)

-- Remover Base64 de produtos e manter apenas URLs HTTP/HTTPS válidas
UPDATE products 
SET image_url = '' 
WHERE image_url LIKE 'data:%';

-- Remover Base64 de clientes
UPDATE clients 
SET avatar_url = '' 
WHERE avatar_url LIKE 'data:%';

-- Remover Base64 de despesas (comprovantes)
UPDATE expenses 
SET receipt_url = '' 
WHERE receipt_url LIKE 'data:%';

-- 3. RECLAMAR ESPAÇO EM DISCO E TABELAS TOAST DO POSTGRESQL
-- IMPORTANTE: O VACUUM FULL limpa e compacta o espaço físico consumido em disco de todas as tabelas.
-- Pode demorar alguns minutos dependendo do tamanho atual do banco.

VACUUM FULL products;
VACUUM FULL clients;
VACUUM FULL expenses;
VACUUM FULL orders;
VACUUM FULL quotes;
