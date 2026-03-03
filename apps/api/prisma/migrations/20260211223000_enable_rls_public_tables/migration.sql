-- Supabase lint fix: enable RLS for all public tables exposed by PostgREST.
-- With RLS enabled and no permissive policy, anon/authenticated access is denied by default.
ALTER TABLE IF EXISTS public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.impostos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registros_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
