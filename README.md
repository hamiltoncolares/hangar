# Hangar

Hangar é uma aplicação para **acompanhar a evolução da carteira de contratos** com entrada mensal por projeto, permitindo análises de receita, custos e margens (bruta e líquida). O foco é consolidar dados por Tier → Cliente → Projeto, gerar dashboards e exportar dados em Excel.

## O que o projeto faz
- Cadastro de **Tiers**, **Clientes** e **Projetos**.
- Cadastro de **Impostos** percentuais por projeto com histórico.
- Registro mensal com **receita bruta, líquida, custo**, status (planejado/realizado) e observações.
- Dashboard anual com filtros por Tier/Cliente/Projeto e métricas de receita/custo/margem.
- Exportação **Excel** com abas por Cliente, por Tier e consolidado geral.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js + Fastify + Prisma
- Banco: Supabase (Postgres)
- Deploy: Netlify (frontend) + Render (API)

## Estrutura do monorepo
- `apps/web` — frontend
- `apps/api` — backend
- `packages/shared` — utilitários/tipos

## Rodar localmente
1. Instalar dependências:
   ```bash
   npm install
   ```

2. Configurar API:
   - Crie `apps/api/.env` com:
     ```
     DATABASE_URL=postgresql://...
     FRONTEND_URL=http://localhost:5173
     ```

3. Rodar API e Web:
   ```bash
   npm run dev:api
   npm run dev:web
   ```

## Deploy

### Frontend (Netlify)
- **Build command**: `npm run build:web`
- **Publish directory**: `apps/web/dist`
- **Env var**: `VITE_API_URL` = URL pública da API no Render

### Backend (Render)
**Passos**
1. Acesse Render → **New** → **Web Service** → conecte o repositório.
2. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
3. Environment Variables:
   - `DATABASE_URL` = Supabase Postgres
   - `FRONTEND_URL` = URL do Netlify (ex.: `https://airhangar.netlify.app`)
4. Deploy.

**Notas**
- O Render free pode entrar em sleep com inatividade.
- O Supabase é o banco e não hospeda sua API Fastify.

## Notas de negócio
- Receita líquida é **persistida**, não recalcula automaticamente ao mudar imposto.
- Ao alterar imposto, deve-se escolher quais registros serão recalculados.

## Próximos passos sugeridos
- Login Microsoft (Azure AD) e controle de permissões
- Upload de logomarca por cliente
- Versão iOS conectada ao mesmo backend
