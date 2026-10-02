import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { startSync, stopSync, pullAll, flushSync } from "@/lib/cloud-sync";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    let syncedFor: string | null = null;

    const handle = async (u: User | null) => {
      if (!active) return;
      if (u && syncedFor !== u.id) {
        syncedFor = u.id;
        setSyncing(true);
        try { await startSync(u.id); } finally { setSyncing(false); }
        qc.invalidateQueries();
      }
      if (!u && syncedFor) { syncedFor = null; stopSync(); qc.clear(); }
      setUser(u);
      setReady(true);
    };

    supabase.auth.getSession().then(({ data }) => handle(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setTimeout(() => handle(session?.user ?? null), 0);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [qc]);

  // Refresh from the cloud when coming back to the app and every 30s.
  useEffect(() => {
    if (!user) return;
    const refresh = async () => {
      if (document.visibilityState !== "visible") { void flushSync(); return; }
      if (await pullAll()) qc.invalidateQueries();
    };
    document.addEventListener("visibilitychange", refresh);
    const id = setInterval(refresh, 30_000);
    return () => { document.removeEventListener("visibilitychange", refresh); clearInterval(id); };
  }, [user, qc]);

  if (!ready || syncing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">{syncing ? "Synchronisation de vos données…" : "Chargement…"}</p>
      </div>
    );
  }

  if (!user) return <SignIn />;
  return <>{children}</>;
}

function SignIn() {
  const [loading, setLoading] = useState(false);
  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Connexion échouée, réessayez."); setLoading(false); return; }
    if (result.redirected) return;
    setLoading(false);
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Cloud className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Atelier Pro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous pour retrouver vos données sur tous vos téléphones et ordinateurs.
        </p>
        <Button onClick={signIn} disabled={loading} className="mt-6 w-full" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continuer avec Google
        </Button>
      </div>
    </div>
  );
}
