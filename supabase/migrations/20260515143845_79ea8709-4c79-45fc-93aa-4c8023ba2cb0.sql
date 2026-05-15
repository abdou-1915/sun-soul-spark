-- Module Boutique : produits, ventes au comptoir
CREATE TABLE public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'accessoire',
  marque TEXT,
  code_barre TEXT,
  prix_achat NUMERIC NOT NULL DEFAULT 0,
  prix_vente NUMERIC NOT NULL DEFAULT 0,
  stock NUMERIC NOT NULL DEFAULT 0,
  seuil_alerte NUMERIC NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON public.produits FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_produits_updated BEFORE UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ventes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  date_vente DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC NOT NULL DEFAULT 0,
  methode_paiement TEXT NOT NULL DEFAULT 'especes',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON public.ventes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.vente_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  produit_id UUID,
  nom_produit TEXT NOT NULL,
  quantite NUMERIC NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vente_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON public.vente_items FOR ALL USING (true) WITH CHECK (true);

-- Décrémenter le stock automatiquement
CREATE OR REPLACE FUNCTION public.decrement_stock_on_vente_item()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.produit_id IS NOT NULL THEN
    UPDATE public.produits SET stock = stock - NEW.quantite WHERE id = NEW.produit_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_vente_items_stock AFTER INSERT ON public.vente_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_vente_item();