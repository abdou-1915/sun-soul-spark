
-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Commandes
CREATE TABLE public.commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'autre', -- cnc, laser, decoration, publicite, autre
  statut TEXT NOT NULL DEFAULT 'en_attente', -- en_attente, en_cours, termine, livre, annule
  prix_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
  date_livraison DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paiements (lié à une commande)
CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES public.commandes(id) ON DELETE CASCADE,
  montant NUMERIC(12,2) NOT NULL,
  methode TEXT NOT NULL DEFAULT 'especes', -- especes, virement, cheque, carte
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dépenses
CREATE TABLE public.depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'autre', -- materiaux, electricite, loyer, salaire, transport, autre
  montant NUMERIC(12,2) NOT NULL,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matériaux (stock)
CREATE TABLE public.materiaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  unite TEXT NOT NULL DEFAULT 'unité', -- m, m², kg, l, unité
  quantite NUMERIC(12,3) NOT NULL DEFAULT 0,
  seuil_alerte NUMERIC(12,3) NOT NULL DEFAULT 0,
  prix_unitaire NUMERIC(12,2) NOT NULL DEFAULT 0,
  fournisseur TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes générales
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  contenu TEXT,
  couleur TEXT NOT NULL DEFAULT 'jaune',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_commandes_updated BEFORE UPDATE ON public.commandes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_materiaux_updated BEFORE UPDATE ON public.materiaux FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS et politiques publiques (pas de connexion utilisateur)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.commandes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.paiements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.depenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.materiaux FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.notes FOR ALL USING (true) WITH CHECK (true);
