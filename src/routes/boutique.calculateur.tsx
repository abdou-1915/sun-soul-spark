import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/types";

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
    </div>
  );
}
