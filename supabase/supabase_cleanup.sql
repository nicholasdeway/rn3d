-- ==============================================================================
-- RN 3D Manager - Script de Limpeza e Configuração do Supabase Storage
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ETAPA 1: Executar em Bloco no SQL Editor
-- (Cria o Bucket no Storage, Políticas RLS e remove strings Base64 do Banco)
-- ------------------------------------------------------------------------------

-- 1.1 Criar Bucket Público para Anexos e Imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rn3d_attachments',
  'rn3d_attachments',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 1.2 Políticas RLS do Storage
DROP POLICY IF EXISTS "Public Storage Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Select Access" ON storage.objects;

CREATE POLICY "Public Storage Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rn3d_attachments');

CREATE POLICY "Public Storage Select Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'rn3d_attachments');

-- 1.3 Zerar strings Base64 das colunas de texto (libera a origem do bloat)
UPDATE products SET image_url = '' WHERE image_url LIKE 'data:%';
UPDATE clients SET avatar_url = '' WHERE avatar_url LIKE 'data:%';
UPDATE expenses SET receipt_url = '' WHERE receipt_url LIKE 'data:%';


-- ------------------------------------------------------------------------------
-- ETAPA 2: Executar separadamente (Linha por Linha no SQL Editor)
-- ⚠️ IMPORTANTE: O PostgreSQL proíbe rodar VACUUM dentro de um bloco de transação.
-- No SQL Editor do Supabase, selecione (destaque) e rode cada uma das linhas abaixo UMA POR UMA.
-- ------------------------------------------------------------------------------

-- Selecione APENAS a linha abaixo e clique em RUN:
VACUUM FULL products;

-- Em seguida, selecione APENAS a linha abaixo e clique em RUN:
VACUUM FULL clients;

-- Selecione APENAS a linha abaixo e clique em RUN:
VACUUM FULL expenses;

-- Selecione APENAS a linha abaixo e clique em RUN:
VACUUM FULL orders;

-- Selecione APENAS a linha abaixo e clique em RUN:
VACUUM FULL quotes;
