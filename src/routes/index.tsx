import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickCommandeWidget, QuickFinanceWidget } from "@/components/quick-widgets";
import { formatMoney } from "@/lib/types";
import {
  Users,
  ClipboardList,
  Wallet,
  Clock,
  Wrench,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  footer,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
  footer?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {value}
            </p>
            {footer && (
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">{footer}</p>
            )}
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent ?? "bg-primary/10 text-primary"}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CashRow({
  label,
  solde,
  entrees,
  sorties,
  accent,
}: {
  label: string;
  solde: number;
  entrees: number;
  sorties: number;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-1.5 rounded-full ${accent}`} />
        <div>
          <p className="text-xs font-medium text-sidebar-foreground/70">{label}</p>
          <p className="text-lg font-bold text-sidebar-foreground">{formatMoney(solde)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-5 sm:pl-0">
        <div className="flex items-center gap-1.5 rounded-lg bg-sidebar-accent/30 px-2 py-1">
          <TrendingUp className="h-3 w-3 text-success" />
          <span className="text-xs font-semibold text-success">{formatMoney(entrees)}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-sidebar-accent/30 px-2 py-1">
          <TrendingDown className="h-3 w-3 text-destructive" />
          <span className="text-xs font-semibold text-destructive">{formatMoney(sorties)}</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  primary,
}: {
  icon: LucideIcon;
  label: string;
  to: string;
  primary?: boolean;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className={`h-14 w-14 justify-self-center rounded-2xl border-2 border-border bg-card p-0 hover:bg-accent sm:h-16 sm:w-16 ${
        primary ? "border-primary/40 text-primary hover:text-primary" : ""
      }`}
    >
      <Link to={to} aria-label={label} title={label}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </Link>
    </Button>
  );
}

function QuickAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label="Ajout rapide"
          className="h-14 w-14 justify-self-center rounded-full shadow-lg shadow-primary/30 sm:h-16 sm:w-16"
        >
          <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Ajout rapide</DialogTitle>
          <DialogDescription>Créer une commande ou enregistrer un mouvement d'argent</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="commande">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="commande">Commande</TabsTrigger>
            <TabsTrigger value="finance">Argent</TabsTrigger>
          </TabsList>
          <TabsContent value="commande" className="mt-3">
            <QuickCommandeWidget />
          </TabsContent>
          <TabsContent value="finance" className="mt-3">
            <QuickFinanceWidget />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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

  // Chiffres du jour (approximation : commandes et ventes créées aujourd'hui)
  const today = new Date().toISOString().slice(0, 10);
  const ventesJour = ventes
    .filter((v) => v.date_vente?.slice(0, 10) === today)
    .reduce((s, v) => s + Number(v.total), 0);
  const commandesJour = commandes.filter((c) => c.date_commande?.slice(0, 10) === today).length;

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-sidebar text-sidebar-foreground">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">ATELIER PRO</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground/60">
              Tableau de bord
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Clients"
          value={String(data?.nbClients ?? 0)}
          icon={Users}
          footer="Total enregistrés"
        />
        <StatCard
          title="Commandes en cours"
          value={String(enCours)}
          icon={ClipboardList}
          accent="bg-warning/15 text-warning"
          footer="En attente + en cours"
        />
        <StatCard
          title="Bénéfice total"
          value={formatMoney(benefice)}
          icon={Wallet}
          accent={
            benefice >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          }
          footer="Atelier + Boutique"
        />
        <StatCard
          title="Impayés"
          value={formatMoney(Math.max(0, impaye))}
          icon={Clock}
          accent="bg-warning/15 text-warning"
          footer="Reste à encaisser"
        />
      </div>

      {/* Cash registers */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-sidebar text-sidebar-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/60">
            Flux de trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CashRow
            label="Caisse Atelier"
            solde={atelierIn - atelierOut}
            entrees={atelierIn}
            sorties={atelierOut}
            accent="bg-primary"
          />
          <Separator className="bg-sidebar-border" />
          <CashRow
            label="Caisse Boutique"
            solde={boutiqueIn - boutiqueOut}
            entrees={boutiqueIn}
            sorties={boutiqueOut}
            accent="bg-chart-3"
          />
        </CardContent>
      </Card>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Actions rapides
        </h2>
        <div className="grid grid-cols-5 items-center gap-2 sm:gap-3">
          <QuickAction icon={Users} label="Clients" to="/clients" />
          <QuickAction icon={ClipboardList} label="Commandes" to="/commandes" primary />
          <QuickAddButton />
          <QuickAction icon={Wallet} label="Finances" to="/finances" />
          <QuickAction icon={Package} label="Stock" to="/materiaux" />
        </div>
      </section>

      {/* Stock alerts */}
      <Card className="rounded-2xl border border-border">
        <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertes stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stockBas.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-3"
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
  );
}

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Tableau de bord — Atelier Pro" },
      { name: "description", content: "Vue d'ensemble de votre activité atelier et boutique." },
      { property: "og:title", content: "Tableau de bord — Atelier Pro" },
      { property: "og:description", content: "Vue d'ensemble de votre activité atelier et boutique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
