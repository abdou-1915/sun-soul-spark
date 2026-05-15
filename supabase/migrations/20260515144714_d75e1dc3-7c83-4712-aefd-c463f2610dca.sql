
ALTER TABLE public.paiements ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'atelier';
ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'atelier';
ALTER TABLE public.paiements ADD CONSTRAINT paiements_source_check CHECK (source IN ('atelier','boutique'));
ALTER TABLE public.depenses ADD CONSTRAINT depenses_source_check CHECK (source IN ('atelier','boutique'));
