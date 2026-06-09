import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  clientsDb,
  commandesDb,
  paiementsDb,
  depensesDb,
  materiauxDb,
  ventesDb,
} from "@/lib/localdb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatMoney, formatDate, STATUT_LABELS } from "@/lib/types";
import {
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Wrench,
  ShoppingCart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { QuickCommandeWidget, QuickFinanceWidget } from "@/components/quick-widgets";

export const Route = createFileRoute("/")({ component: Dashboard });

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
}) {
  const len = value.length;
  const sizeClass =
    len > 14
      ? "text-[10px] sm:text-sm"
      : len > 10
        ? "text-[11px] sm:text-base"
        : len > 7
          ? "text-xs sm:text-lg"
          : "text-base sm:text-xl";
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${accent ?? "bg-primary/10 text-primary"}`}
        >
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {title}
          </p>
          <p
            className={`mt-1 overflow-x-auto whitespace-nowrap font-bold leading-none text-foreground ${sizeClass}`}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CaisseSection({
  title,
  icon: Icon,
  color,
  encaisse,
  depenses,
}: {
  title: string;
  icon: LucideIcon;
  color: string;
  encaisse: number;
  depenses: number;
}) {
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
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CaisseMetric
          title="Encaissé"
          value={formatMoney(encaisse)}
          icon={TrendingUp}
          accent="bg-success/15 text-success"
        />
        <CaisseMetric
          title="Dépenses"
          value={formatMoney(depenses)}
          icon={TrendingDown}
          accent="bg-destructive/15 text-destructive"
        />
        <CaisseMetric
          title="Solde"
          value={formatMoney(solde)}
          icon={Wallet}
          accent={solde >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}
        />
      </CardContent>
    </Card>
  );
}

function CaisseMetric({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-background/50 p-3 sm:flex-col sm:items-start">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-medium uppercase text-muted-foreground sm:text-xs">
          {title}
        </span>
      </div>
      <span className="max-w-[160px] overflow-x-auto whitespace-nowrap text-right text-sm font-bold leading-none text-foreground sm:max-w-full sm:text-base">
        {value}
      </span>
    </div>
  );
}

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => ({
      nbClients: clientsDb.count(),
      commandes: commandesDb.list(),
      paiements: paiementsDb.list(),
      depenses: depensesDb.list(),
      materiaux: materiauxDb.list(),
      ventes: ventesDb.list(),
    }),
  });

  const commandes = data?.commandes ?? [];
  const paiements = data?.paiements ?? [];
  const depenses = data?.depenses ?? [];
  const ventes = data?.ventes ?? [];

  const caissePaiements = paiements.filter(
    (p) => !["dette_recue", "remboursement_recu"].includes(p.categorie),
  );
  const caisseDepenses = depenses.filter(
    (d) => !["dette_payee", "pret_accorde"].includes(d.categorie),
  );
  const atelierIn = caissePaiements
    .filter((p) => p.source === "atelier")
    .reduce((s, p) => s + Number(p.montant), 0);
  const atelierOut = caisseDepenses
    .filter((d) => d.source === "atelier")
    .reduce((s, d) => s + Number(d.montant), 0);
  const boutiqueIn =
    caissePaiements
      .filter((p) => p.source === "boutique")
      .reduce((s, p) => s + Number(p.montant), 0) + ventes.reduce((s, v) => s + Number(v.total), 0);
  const boutiqueOut = caisseDepenses
    .filter((d) => d.source === "boutique")
    .reduce((s, d) => s + Number(d.montant), 0);

  const totalIn = atelierIn + boutiqueIn;
  const totalOut = atelierOut + boutiqueOut;
  const benefice = totalIn - totalOut;
  const totalCA = commandes.reduce((s, c) => s + Number(c.prix_total), 0);
  const impaye = totalCA - paiements.reduce((s, p) => s + Number(p.montant), 0);
  const enCours = commandes.filter(
    (c) => c.statut === "en_cours" || c.statut === "en_attente",
  ).length;
  const stockBas = (data?.materiaux ?? []).filter(
    (m) => Number(m.quantite) <= Number(m.seuil_alerte),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de votre activité" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Clients" value={String(data?.nbClients ?? 0)} icon={Users} />
        <StatCard
          title="Commandes en cours"
          value={String(enCours)}
          icon={ClipboardList}
          accent="bg-warning/15 text-warning"
        />
        <StatCard
          title="Bénéfice total"
          value={formatMoney(benefice)}
          icon={Wallet}
          accent={
            benefice >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          }
        />
        <StatCard
          title="Impayés"
          value={formatMoney(Math.max(0, impaye))}
          icon={Clock}
          accent="bg-warning/15 text-warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CaisseSection
          title="Caisse Atelier"
          icon={Wrench}
          color="bg-primary/15 text-primary"
          encaisse={atelierIn}
          depenses={atelierOut}
        />
        <CaisseSection
          title="Caisse Boutique"
          icon={ShoppingCart}
          color="bg-chart-3/15 text-chart-3"
          encaisse={boutiqueIn}
          depenses={boutiqueOut}
        />
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
              <Link
                key={c.id}
                to="/commandes"
                className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{c.titre}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.date_commande)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{STATUT_LABELS[c.statut]}</Badge>
                  <span className="font-semibold text-foreground">
                    {formatMoney(Number(c.prix_total))}
                  </span>
                </div>
              </Link>
            ))}
            {commandes.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune commande pour le moment
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertes stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stockBas.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{m.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    Seuil : {m.seuil_alerte} {m.unite}
                  </p>
                </div>
                <Badge variant="destructive">
                  {Number(m.quantite)} {m.unite}
                </Badge>
              </div>
            ))}
            {stockBas.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tous les stocks sont OK 👍
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
