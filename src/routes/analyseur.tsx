import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { produitsDb, commandesDb, achatsDevisesDb, type AchatDevise } from "@/lib/localdb";
import { formatMoney, formatDate, TYPE_LABELS, CATEGORIE_LABELS, type Produit, type Commande } from "@/lib/types";

export const Route = createFileRoute("/analyseur")({
  head: () => ({
    meta: [
      { title: "Analyseur de prix — Atelier Pro" },
      { name: "description", content: "Marges, prix conseillés et historique des taux euro/dollar." },
      { property: "og:title", content: "Analyseur de prix — Atelier Pro" },
      { property: "og:description", content: "Analyse des prix pour l'atelier, la boutique et les devises." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyseurPage,
});

const n = (s: string) => Number(String(s).replace(",", ".")) || 0;
const fmt = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function PrixConseille({ defaultCout = "" }: { defaultCout?: string }) {
  const [cout, setCout] = useState(defaultCout);
  const [marge, setMarge] = useState("30");
  const prix = n(cout) * (1 + n(marge) / 100);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Prix de vente conseillé</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Coût total (DA)</Label><Input type="number" inputMode="decimal" value={cout} onChange={(e) => setCout(e.target.value)} /></div>
          <div><Label>Marge souhaitée (%)</Label><Input type="number" inputMode="decimal" value={marge} onChange={(e) => setMarge(e.target.value)} /></div>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Bénéfice : {formatMoney(prix - n(cout))}</p>
          <p className="text-3xl font-bold text-primary">{formatMoney(prix)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyseurPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [achats, setAchats] = useState<AchatDevise[]>([]);
  useEffect(() => {
    setProduits(produitsDb.list());
    setCommandes(commandesDb.list().filter((c) => c.statut !== "annule"));
    setAchats(achatsDevisesDb.list());
  }, []);

  const prodRows = produits
    .map((p) => {
      const m = Number(p.prix_vente) - Number(p.prix_achat);
      const pct = Number(p.prix_achat) > 0 ? (m / Number(p.prix_achat)) * 100 : 0;
      return { p, m, pct };
    })
    .sort((a, b) => a.pct - b.pct);
  const margeMoy = prodRows.length ? prodRows.reduce((s, r) => s + r.pct, 0) / prodRows.length : 0;

  const parType = Object.entries(TYPE_LABELS).map(([k, label]) => {
    const list = commandes.filter((c) => c.type === k);
    const total = list.reduce((s, c) => s + Number(c.prix_total), 0);
    return { label, count: list.length, total, moy: list.length ? total / list.length : 0 };
  }).filter((r) => r.count > 0);

  const tot = achats.reduce((s, a) => ({ eur: s.eur + a.eur, usd: s.usd + a.usd, da: s.da + a.da }), { eur: 0, usd: 0, da: 0 });

  return (
    <div className="space-y-6">
      <PageHeader title="Analyseur de prix" description="Marges, prix conseillés et taux de change" />
      <Tabs defaultValue="boutique">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="atelier">Atelier</TabsTrigger>
          <TabsTrigger value="boutique">Boutique</TabsTrigger>
          <TabsTrigger value="devises">Devises</TabsTrigger>
        </TabsList>

        <TabsContent value="atelier" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Prix des commandes par type</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {parType.length === 0 && <p className="text-sm text-muted-foreground">Aucune commande</p>}
              {parType.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b py-2 last:border-0">
                  <div><p className="font-medium">{r.label}</p><p className="text-xs text-muted-foreground">{r.count} commande(s) · total {formatMoney(r.total)}</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Prix moyen</p><p className="font-bold">{formatMoney(r.moy)}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <PrixConseille />
        </TabsContent>

        <TabsContent value="boutique" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Marge par produit <span className="text-sm font-normal text-muted-foreground">(moyenne {fmt(margeMoy)} %)</span></CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {prodRows.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit</p>}
              {prodRows.map(({ p, m, pct }) => (
                <div key={p.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0">
                  <div className="min-w-0"><p className="truncate font-medium">{p.nom}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORIE_LABELS[p.categorie]} · achat {formatMoney(Number(p.prix_achat))} → vente {formatMoney(Number(p.prix_vente))}</p></div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold">{formatMoney(m)}</p>
                    <Badge variant={pct < 10 ? "destructive" : "outline"}>{fmt(pct)} %</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <PrixConseille />
        </TabsContent>

        <TabsContent value="devises" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Taux moyen 1 €</p><p className="text-2xl font-bold">{fmt(tot.eur ? tot.da / tot.eur : 0)} DA</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Taux moyen 1 $</p><p className="text-2xl font-bold">{fmt(tot.usd ? tot.da / tot.usd : 0)} DA</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Historique des achats</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {achats.length === 0 && <p className="text-sm text-muted-foreground">Enregistrez un achat depuis le Calculateur.</p>}
              {achats.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-0">
                  <div><p className="font-medium">{fmt(a.eur)} € → {fmt(a.usd)} $ pour {formatMoney(a.da)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.date)} · 1 € = {fmt(a.eur ? a.da / a.eur : 0)} DA · 1 $ = {fmt(a.usd ? a.da / a.usd : 0)} DA</p></div>
                  <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => { achatsDevisesDb.delete(a.id); setAchats(achatsDevisesDb.list()); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
