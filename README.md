# RN 3D Sistema — Gestão Comercial & Oficina de Impressão 3D 🚀

Sistema completo e de alto desempenho projetado especificamente para gestão comercial, controle de estoque em consignação, expedição de pedidos, orçamentos e custos operacionais de oficinas de Impressão 3D.

---

## 🛠️ Principais Funcionalidades

- **📦 Catálogo de Produtos com Duplo Preço**:
  - Tabela de Preço **À Vista / 50% Entrada** e **Consignado / Faturado**.
  - Gerador automático de **SKU de 4 dígitos** com verificação anti-duplicatas em tempo real.
  - Recorte e ajuste interativo de fotos de produtos integrados.
- **📄 Orçamentos & Pedidos Inteligentes**:
  - Seleção dinâmica de preços com base na modalidade de pagamento (PIX/Vista vs Consignado).
  - Cálculo de Custo Interno de Logística e Frete por Cliente (oculto no PDF do cliente).
  - Geração e download de **PDF Profissional para Impressão e Envio pelo WhatsApp**.
  - Transição de Orçamentos Aprovados diretamente para Fila de Produção/Pedidos.
- **🤝 Gestão de Consignação e Visitas de Campo**:
  - Controle detalhado de estoque alocado nos pontos de venda dos clientes parceiros.
  - Wizard interativo para registro de visitas de auditoria e acertos de estoque.
  - Troca automatizada de produtos de baixo giro.
- **☁️ Integração com Supabase (PostgreSQL)**:
  - Sincronização em tempo real de Produtos, Clientes, Pedidos e Consignações com o banco de dados Supabase.
  - Botão de **Sincronização em 1 Clique** e backup persistente via `localStorage`.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (v18+) e **npm**

### Passo a Passo

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/seu-usuario/rn3d-sistema.git
   cd rn3d-sistema
   ```

2. **Instalar as Dependências**:
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

4. **Executar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em: `http://localhost:3000`

---

## 🗄️ Configuração do Banco de Dados Supabase

Para inicializar a estrutura do PostgreSQL no seu projeto Supabase, acesse o **Supabase Dashboard -> SQL Editor** e execute os scripts localizados em:
- `supabase/schema.sql` (Estrutura principal de tabelas e políticas RLS)
- `supabase/catalog_seed.sql` (Seed opcional para catálogo de produtos)

---

## 📦 Build para Produção

Para gerar o pacote otimizado de produção:
```bash
npm run build
```
Os arquivos prontos para deploy estarão disponíveis no diretório `/dist`.
