import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatMoney, formatDate, STATUT_LABELS, type Commande, type Paiement, type Depense, type Materiau } from "@/lib/types";
import { Users, ClipboardList, TrendingUp, TrendingDown, Wallet, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { QuickCommandeWidget, QuickFinanceWidget } from "@/components/quick-widgets";

export const Route = createFileRoute("/")({ component: Dashboard });

function StatCard({ title, value, icon: Icon, accent }: { title: string; value: string; icon: any; accent?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-0.5 truncate text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [c, cmd, pay, dep, mat] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("commandes").select("*").order("created_at", { ascending: false }),
        supabase.from("paiements").select("*"),
        supabase.from("depenses").select("*"),
        supabase.from("materiaux").select("*"),
      ]);
      return {
        nbClients: c.count ?? 0,
        commandes: (cmd.data ?? []) as Commande[],
        paiements: (pay.data ?? []) as Paiement[],
        depenses: (dep.data ?? []) as Depense[],
        materiaux: (mat.data ?? []) as Materiau[],
      };
    },
  });

  const commandes = data?.commandes ?? [];
  const totalCA = commandes.reduce((s, c) => s + Number(c.prix_total), 0);
  const totalPaye = (data?.paiements ?? []).reduce((s, p) => s + Number(p.montant), 0);
  const totalDepenses = (data?.depenses ?? []).reduce((s, d) => s + Number(d.montant), 0);
  const benefice = totalPaye - totalDepenses;
  const impaye = totalCA - totalPaye;
  const enCours = commandes.filter((c) => c.statut === "en_cours" || c.statut === "en_attente").length;
  const stockBas = (data?.materiaux ?? []).filter((m) => Number(m.quantite) <= Number(m.seuil_alerte));

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de votre activité" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Clients" value={String(data?.nbClients ?? 0)} icon={Users} />
        <StatCard title="Commandes en cours" value={String(enCours)} icon={ClipboardList} accent="bg-warning/15 text-warning" />
        <StatCard title="Encaissé" value={formatMoney(totalPaye)} icon={TrendingUp} accent="bg-success/15 text-success" />
        <StatCard title="Dépenses" value={formatMoney(totalDepenses)} icon={TrendingDown} accent="bg-destructive/15 text-destructive" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard title="Bénéfice" value={formatMoney(benefice)} icon={Wallet} accent={benefice >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"} />
        <StatCard title="Impayés" value={formatMoney(Math.max(0, impaye))} icon={Clock} accent="bg-warning/15 text-warning" />
        <StatCard title="Stock bas" value={`${stockBas.length} article${stockBas.length > 1 ? "s" : ""}`} icon={AlertTriangle} accent="bg-destructive/15 text-destructive" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuickCommandeWidget />
        <QuickFinanceWidget />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières commandes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {commandes.slice(0, 6).map((c) => (
              <Link key={c.id} to="/commandes" className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-accent/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{c.titre}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.date_commande)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{STATUT_LABELS[c.statut]}</Badge>
                  <span className="font-semibold text-foreground">{formatMoney(Number(c.prix_total))}</span>
                </div>
              </Link>
            ))}
            {commandes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune commande pour le moment</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertes stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stockBas.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div>
                  <p className="font-medium text-foreground">{m.nom}</p>
                  <p className="text-xs text-muted-foreground">Seuil : {m.seuil_alerte} {m.unite}</p>
                </div>
                <Badge variant="destructive">{Number(m.quantite)} {m.unite}</Badge>
              </div>
            ))}
            {stockBas.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tous les stocks sont OK 👍</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
