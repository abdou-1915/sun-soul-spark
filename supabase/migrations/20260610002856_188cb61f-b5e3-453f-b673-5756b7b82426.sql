
DROP POLICY IF EXISTS "public_all" ON public.materiaux;
DROP POLICY IF EXISTS "public_all" ON public.paiements;
DROP POLICY IF EXISTS "public_all" ON public.notes;
DROP POLICY IF EXISTS "public_all" ON public.clients;
DROP POLICY IF EXISTS "public_all" ON public.depenses;
DROP POLICY IF EXISTS "public_all" ON public.commandes;
DROP POLICY IF EXISTS "public_all" ON public.produits;
DROP POLICY IF EXISTS "public_all" ON public.ventes;
DROP POLICY IF EXISTS "public_all" ON public.vente_items;

REVOKE ALL ON public.materiaux, public.paiements, public.notes, public.clients, public.depenses, public.commandes, public.produits, public.ventes, public.vente_items FROM anon, authenticated;

GRANT ALL ON public.materiaux, public.paiements, public.notes, public.clients, public.depenses, public.commandes, public.produits, public.ventes, public.vente_items TO service_role;
