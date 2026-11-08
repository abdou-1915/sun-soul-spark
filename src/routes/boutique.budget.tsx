import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/types";
import { achatsDevisesDb, depensesDevisesDb } from "@/lib/localdb";
import { toast } from "sonner";

export const Route = createFileRoute("/boutique/budget")({
  head: () => ({
    meta: [
      { title: "Budget devises — Atelier Pro" },
      { name: "description", content: "Suivez votre argent en dollar, euro et dinar : ajouts, dépenses et solde." },
      { property: "og:title", content: "Budget devises — Atelier Pro" },
      { property: "og:description", content: "Suivez votre argent en dollar, euro et dinar : ajouts, dépenses et solde." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BudgetPage,
});

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;
const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function BudgetPage() {
  const [eur, setEur] = useState("");
  const [usd, setUsd] = useState("");
  const [da, setDa] = useState("");
  const [desc, setDesc] = useState("");
  const [montant, setMontant] = useState("");
  const [achats, setAchats] = useState<ReturnType<typeof achatsDevisesDb.list>>([]);
  const [deps, setDeps] = useState<ReturnType<typeof depensesDevisesDb.list>>([]);

  const reload = () => { setAchats(achatsDevisesDb.list()); setDeps(depensesDevisesDb.list()); };
  useEffect(reload, []);

  const totUsd = achats.reduce((s, a) => s + a.usd, 0);
  const totEur = achats.reduce((s, a) => s + a.eur, 0);
  const totDa = achats.reduce((s, a) => s + a.da, 0);
  const daParUsd = totUsd > 0 ? totDa / totUsd : 0;
  const eurParUsd = totUsd > 0 ? totEur / totUsd : 0;
  const depense = deps.reduce((s, d) => s + d.usd, 0);
  const solde = totUsd - depense;
  const m = num(montant);

  const mouvements = [
    ...achats.map((a) => ({ id: a.id, date: a.date, kind: "in" as const, label: `Achat ${fmt(a.eur)} € → ${fmt(a.usd)} $ (${fmt(a.da)} DA)`, usd: a.usd })),
    ...deps.map((d) => ({ id: d.id, date: d.date, kind: "out" as const, label: d.description || "Dépense", usd: d.usd })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader title="Budget devises" description="Votre argent en dollar, euro et dinar" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Solde en dollar</p><p className="text-2xl font-bold text-primary">{fmt(solde)} $</p></div>
        <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Équivalent euro</p><p className="text-2xl font-bold">{fmt(solde * eurParUsd)} €</p></div>
        <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Équivalent dinar</p><p className="text-2xl font-bold">{formatMoney(solde * daParUsd)}</p></div>
      </div>
      <p className="text-xs text-muted-foreground">Taux moyen : 1 $ = {fmt(daParUsd)} DA = {fmt(eurParUsd)} €</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Ajouter de l'argent</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><Label>Euros achetés (€)</Label><Input type="number" inputMode="decimal" value={eur} onChange={(e) => setEur(e.target.value)} placeholder="Ex: 300" /></div>
          <div><Label>Dollars reçus ($)</Label><Input type="number" inputMode="decimal" value={usd} onChange={(e) => setUsd(e.target.value)} placeholder="Ex: 329.41" /></div>
          <div><Label>Dinars payés (DA)</Label><Input type="number" inputMode="decimal" value={da} onChange={(e) => setDa(e.target.value)} placeholder="Ex: 84000" /></div>
          <Button type="button" className="sm:col-span-3"
            onClick={() => {
              if (num(da) <= 0 || num(usd) <= 0) return;
              achatsDevisesDb.insert({ eur: num(eur), usd: num(usd), da: num(da) });
              setEur(""); setUsd(""); setDa(""); reload();
              toast.success("Argent ajouté au budget");
            }}>
            Ajouter au budget
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Enregistrer une dépense</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>Produit acheté</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Écrans iPhone" /></div>
            <div><Label>Prix en dollar ($)</Label><Input type="number" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Ex: 220" /></div>
          </div>
          {m > 0 && (
            <p className="text-sm">Coût : <b>{fmt(m)} $</b> = <b>{fmt(m * eurParUsd)} €</b> = <b>{formatMoney(m * daParUsd)}</b> · Reste : <b>{fmt(solde - m)} $</b></p>
          )}
          <Button type="button" className="w-full" onClick={() => {
            if (m <= 0) return;
            depensesDevisesDb.insert({ description: desc, usd: m });
            setDesc(""); setMontant(""); reload();
            toast.success("Dépense enregistrée");
          }}>Enregistrer la dépense</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Mouvements</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {mouvements.length === 0 && <p className="text-sm text-muted-foreground">Aucun mouvement.</p>}
          {mouvements.map((mv) => (
            <div key={mv.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{mv.label}</p>
                <p className="text-xs text-muted-foreground">{new Date(mv.date).toLocaleDateString("fr-FR")}{mv.kind === "out" ? ` · ${fmt(mv.usd * eurParUsd)} € · ${formatMoney(mv.usd * daParUsd)}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={mv.kind === "in" ? "font-semibold text-primary" : "font-semibold text-destructive"}>{mv.kind === "in" ? "+" : "−"}{fmt(mv.usd)} $</span>
                <Button size="sm" variant="ghost" onClick={() => { (mv.kind === "in" ? achatsDevisesDb : depensesDevisesDb).delete(mv.id); reload(); }}>✕</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
