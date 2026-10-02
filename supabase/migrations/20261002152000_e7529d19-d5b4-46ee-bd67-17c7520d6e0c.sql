CREATE TABLE public.user_store (
  user_id uuid NOT NULL,
  key text NOT NULL,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_store TO authenticated;
GRANT ALL ON public.user_store TO service_role;
ALTER TABLE public.user_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own store" ON public.user_store FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own store" ON public.user_store FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own store" ON public.user_store FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own store" ON public.user_store FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_store_updated BEFORE UPDATE ON public.user_store FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();