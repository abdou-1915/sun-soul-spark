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

export const Route = createFileRoute("/boutique/calculateur")({
  head: () => ({
    meta: [
      { title: "Calculateur de devises — Atelier Pro" },
      { name: "description", content: "Calculez le prix en dinar de vos achats en euro ou en dollar." },
      { property: "og:title", content: "Calculateur de devises — Atelier Pro" },
      { property: "og:description", content: "Taux réel EUR / USD en dinar et conversion de prix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalculateurPage,
});

const KEY = "calc_devises";
const num = (s: string) => Number(String(s).replace(",", ".")) || 0;
const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function CalculateurPage() {
  const [eur, setEur] = useState("300");
  const [usd, setUsd] = useState("380");
  const [da, setDa] = useState("80000");
  const [prix, setPrix] = useState("");
  const [devise, setDevise] = useState<"usd" | "eur">("usd");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s) { setEur(s.eur); setUsd(s.usd); setDa(s.da); }
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify({ eur, usd, da })); }, [eur, usd, da]);

  const tauxEur = num(eur) > 0 ? num(da) / num(eur) : 0;
  const tauxUsd = num(usd) > 0 ? num(da) / num(usd) : 0;
  const eurUsd = num(eur) > 0 ? num(usd) / num(eur) : 0;
  const taux = devise === "usd" ? tauxUsd : tauxEur;
  const resultat = num(prix) * taux;

  return (
    <div className="space-y-6">
      <PageHeader title="Calculateur" description="Prix réel en dinar selon votre achat de devises" />

      <Card>
        <CardHeader><CardTitle className="text-base">1. Votre achat de devises</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><Label>Euros achetés (€)</Label><Input type="number" inputMode="decimal" value={eur} onChange={(e) => setEur(e.target.value)} /></div>
          <div><Label>Dollars reçus ($)</Label><Input type="number" inputMode="decimal" value={usd} onChange={(e) => setUsd(e.target.value)} /></div>
          <div><Label>Dinars payés (DA)</Label><Input type="number" inputMode="decimal" value={da} onChange={(e) => setDa(e.target.value)} /></div>
          <Button type="button" variant="outline" className="sm:col-span-3"
            onClick={() => { if (num(da) > 0) { achatsDevisesDb.insert({ eur: num(eur), usd: num(usd), da: num(da) }); setTick((t) => t + 1); toast.success("Achat enregistré dans l'historique"); } }}>
            Enregistrer cet achat dans l'historique
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">1 € coûte</p>
          <p className="text-2xl font-bold">{fmt(tauxEur)} DA</p>
          <p className="text-xs text-muted-foreground">{fmt(num(da))} ÷ {fmt(num(eur))}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">1 $ coûte</p>
          <p className="text-2xl font-bold">{fmt(tauxUsd)} DA</p>
          <p className="text-xs text-muted-foreground">{fmt(num(da))} ÷ {fmt(num(usd))}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">1 € =</p>
          <p className="text-2xl font-bold">{fmt(eurUsd)} $</p>
          <p className="text-xs text-muted-foreground">change obtenu</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">2. Convertir un prix en dinar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" variant={devise === "usd" ? "default" : "outline"} onClick={() => setDevise("usd")}>Dollar ($)</Button>
            <Button type="button" variant={devise === "eur" ? "default" : "outline"} onClick={() => setDevise("eur")}>Euro (€)</Button>
          </div>
          <div><Label>Prix en {devise === "usd" ? "dollar ($)" : "euro (€)"}</Label>
            <Input type="number" inputMode="decimal" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Ex: 12.5" /></div>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">{fmt(num(prix))} {devise === "usd" ? "$" : "€"} × {fmt(taux)} DA</p>
            <p className="text-3xl font-bold text-primary">{formatMoney(resultat)}</p>
          </div>
        </CardContent>
      </Card>

      <Budget refresh={tick} onChange={() => setTick((t) => t + 1)} />
    </div>
  );
}

function Budget({ refresh, onChange }: { refresh: number; onChange: () => void }) {
  const [desc, setDesc] = useState("");
  const [montant, setMontant] = useState("");
  const [achats, setAchats] = useState<ReturnType<typeof achatsDevisesDb.list>>([]);
  const [deps, setDeps] = useState<ReturnType<typeof depensesDevisesDb.list>>([]);
  useEffect(() => { setAchats(achatsDevisesDb.list()); setDeps(depensesDevisesDb.list()); }, [refresh]);

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
    <Card>
      <CardHeader><CardTitle className="text-base">3. Mon budget en devises</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Pour ajouter de l'argent : remplissez la partie 1 puis « Enregistrer cet achat ».</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Solde en dollar</p><p className="text-2xl font-bold text-primary">{fmt(solde)} $</p></div>
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Équivalent euro</p><p className="text-2xl font-bold">{fmt(solde * eurParUsd)} €</p></div>
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Équivalent dinar</p><p className="text-2xl font-bold">{formatMoney(solde * daParUsd)}</p></div>
        </div>
        <p className="text-xs text-muted-foreground">Taux moyen : 1 $ = {fmt(daParUsd)} DA = {fmt(eurParUsd)} €</p>

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
          setDesc(""); setMontant(""); onChange(); toast.success("Dépense enregistrée");
        }}>Enregistrer la dépense</Button>

        <div className="space-y-2">
          {mouvements.length === 0 && <p className="text-sm text-muted-foreground">Aucun mouvement.</p>}
          {mouvements.map((mv) => (
            <div key={mv.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{mv.label}</p>
                <p className="text-xs text-muted-foreground">{new Date(mv.date).toLocaleDateString("fr-FR")}{mv.kind === "out" ? ` · ${fmt(mv.usd * eurParUsd)} € · ${formatMoney(mv.usd * daParUsd)}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={mv.kind === "in" ? "font-semibold text-primary" : "font-semibold text-destructive"}>{mv.kind === "in" ? "+" : "−"}{fmt(mv.usd)} $</span>
                <Button size="sm" variant="ghost" onClick={() => { (mv.kind === "in" ? achatsDevisesDb : depensesDevisesDb).delete(mv.id); onChange(); }}>✕</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
