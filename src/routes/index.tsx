import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatMoney, formatDate, STATUT_LABELS, type Commande, type Paiement, type Depense, type Materiau, type Vente } from "@/lib/types";
import { Users, ClipboardList, TrendingUp, TrendingDown, Wallet, AlertTriangle, Clock, Wrench, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { QuickCommandeWidget, QuickFinanceWidget } from "@/components/quick-widgets";

export const Route = createFileRoute("/")({ component: Dashboard });

function StatCard({ title, value, icon: Icon, accent }: { title: string; value: string; icon: any; accent?: string }) {
  const len = value.length;
  const sizeClass = len > 12 ? "text-sm" : len > 9 ? "text-base" : len > 7 ? "text-lg" : "text-xl";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{title}</p>
          <p className={`mt-0.5 font-bold text-foreground break-words leading-tight ${sizeClass}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CaisseSection({
  title, icon: Icon, color, encaisse, depenses, extra,
}: { title: string; icon: any; color: string; encaisse: number; depenses: number; extra?: { label: string; value: string } }) {
  const solde = encaisse - depenses;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`flex h-8 w-8 items-center justify-center rounded-md ${color}`}>
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard title="Encaissé" value={formatMoney(encaisse)} icon={TrendingUp} accent="bg-success/15 text-success" />
        <StatCard title="Dépenses" value={formatMoney(depenses)} icon={TrendingDown} accent="bg-destructive/15 text-destructive" />
        <StatCard title="Solde" value={formatMoney(solde)} icon={Wallet} accent={solde >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"} />
        {extra && <StatCard title={extra.label} value={extra.value} icon={ClipboardList} accent="bg-warning/15 text-warning" />}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [c, cmd, pay, dep, mat, ven] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("commandes").select("*").order("created_at", { ascending: false }),
        supabase.from("paiements").select("*"),
        supabase.from("depenses").select("*"),
        supabase.from("materiaux").select("*"),
        supabase.from("ventes").select("*"),
      ]);
      return {
        nbClients: c.count ?? 0,
        commandes: (cmd.data ?? []) as Commande[],
        paiements: (pay.data ?? []) as Paiement[],
        depenses: (dep.data ?? []) as Depense[],
        materiaux: (mat.data ?? []) as Materiau[],
        ventes: (ven.data ?? []) as Vente[],
      };
    },
  });

  const commandes = data?.commandes ?? [];
  const paiements = data?.paiements ?? [];
  const depenses = data?.depenses ?? [];
  const ventes = data?.ventes ?? [];

  const sumBy = <T extends { source: string; montant?: number; total?: number }>(arr: T[], src: string, key: "montant" | "total" = "montant") =>
    arr.filter((x) => x.source === src).reduce((s, x) => s + Number((x as any)[key] ?? 0), 0);

  const atelierIn = paiements.filter((p) => p.source === "atelier").reduce((s, p) => s + Number(p.montant), 0);
  const atelierOut = sumBy(depenses, "atelier");
  const boutiquePaiements = paiements.filter((p) => p.source === "boutique").reduce((s, p) => s + Number(p.montant), 0);
  const boutiqueVentes = ventes.reduce((s, v) => s + Number(v.total), 0);
  const boutiqueIn = boutiquePaiements + boutiqueVentes;
  const boutiqueOut = sumBy(depenses, "boutique");

  const totalIn = atelierIn + boutiqueIn;
  const totalOut = atelierOut + boutiqueOut;
  const benefice = totalIn - totalOut;
  const totalCA = commandes.reduce((s, c) => s + Number(c.prix_total), 0);
  const impaye = totalCA - paiements.reduce((s, p) => s + Number(p.montant), 0);
  const enCours = commandes.filter((c) => c.statut === "en_cours" || c.statut === "en_attente").length;
  const stockBas = (data?.materiaux ?? []).filter((m) => Number(m.quantite) <= Number(m.seuil_alerte));

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de votre activité" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Clients" value={String(data?.nbClients ?? 0)} icon={Users} />
        <StatCard title="Commandes en cours" value={String(enCours)} icon={ClipboardList} accent="bg-warning/15 text-warning" />
        <StatCard title="Bénéfice total" value={formatMoney(benefice)} icon={Wallet} accent={benefice >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"} />
        <StatCard title="Impayés" value={formatMoney(Math.max(0, impaye))} icon={Clock} accent="bg-warning/15 text-warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CaisseSection title="Caisse Atelier" icon={Wrench} color="bg-primary/15 text-primary" encaisse={atelierIn} depenses={atelierOut} />
        <CaisseSection title="Caisse Boutique" icon={ShoppingCart} color="bg-chart-3/15 text-chart-3" encaisse={boutiqueIn} depenses={boutiqueOut} />
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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
