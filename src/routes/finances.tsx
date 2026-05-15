import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Wrench, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { type Paiement, type Depense, type Commande, type Vente, type Source, formatMoney, formatDate, SOURCE_LABELS } from "@/lib/types";

export const Route = createFileRoute("/finances")({ component: FinancesPage });

const CATEGORIES: Record<Depense["categorie"], string> = {
  materiaux: "Matériaux", electricite: "Électricité", loyer: "Loyer", salaire: "Salaire", transport: "Transport", autre: "Autre",
};
const METHODES = { especes: "Espèces", virement: "Virement", cheque: "Chèque", carte: "Carte" } as const;

type SourceFilter = "tout" | Source;

function FinancesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<SourceFilter>("tout");

  const { data: paiements = [] } = useQuery({ queryKey: ["paiements"], queryFn: async () => (await supabase.from("paiements").select("*").order("date_paiement", { ascending: false })).data as Paiement[] });
  const { data: depenses = [] } = useQuery({ queryKey: ["depenses"], queryFn: async () => (await supabase.from("depenses").select("*").order("date_depense", { ascending: false })).data as Depense[] });
  const { data: commandes = [] } = useQuery({ queryKey: ["commandes-finances"], queryFn: async () => (await supabase.from("commandes").select("id,titre,prix_total")).data as Pick<Commande, "id" | "titre" | "prix_total">[] });
  const { data: ventes = [] } = useQuery({ queryKey: ["ventes-finances"], queryFn: async () => (await supabase.from("ventes").select("*").order("date_vente", { ascending: false })).data as Vente[] });

  // Calcul par caisse
  const caisses = useMemo(() => {
    const atelierIn = paiements.filter(p => p.source === "atelier").reduce((s, p) => s + Number(p.montant), 0);
    const atelierOut = depenses.filter(d => d.source === "atelier").reduce((s, d) => s + Number(d.montant), 0);
    const boutiqueIn = paiements.filter(p => p.source === "boutique").reduce((s, p) => s + Number(p.montant), 0)
      + ventes.reduce((s, v) => s + Number(v.total), 0);
    const boutiqueOut = depenses.filter(d => d.source === "boutique").reduce((s, d) => s + Number(d.montant), 0);
    return {
      atelier: { in: atelierIn, out: atelierOut, solde: atelierIn - atelierOut },
      boutique: { in: boutiqueIn, out: boutiqueOut, solde: boutiqueIn - boutiqueOut },
    };
  }, [paiements, depenses, ventes]);

  const filteredPaiements = filter === "tout" ? paiements : paiements.filter(p => p.source === filter);
  const filteredDepenses = filter === "tout" ? depenses : depenses.filter(d => d.source === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Finances" description="Caisses séparées : Atelier et Boutique" />

      {/* Caisses séparées */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CaisseCard title="Caisse Atelier" icon={<Wrench className="h-5 w-5" />} data={caisses.atelier} accent="bg-primary/15 text-primary" />
        <CaisseCard title="Caisse Boutique" icon={<ShoppingCart className="h-5 w-5" />} data={caisses.boutique} accent="bg-accent/30 text-accent-foreground" />
      </div>

      {/* Filtre par source */}
      <div className="flex items-center gap-2">
        <Label className="text-sm">Afficher :</Label>
        <Select value={filter} onValueChange={(v) => setFilter(v as SourceFilter)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tout">Tout</SelectItem>
            <SelectItem value="atelier">Atelier seulement</SelectItem>
            <SelectItem value="boutique">Boutique seulement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="paiements">
        <TabsList><TabsTrigger value="paiements">Paiements</TabsTrigger><TabsTrigger value="depenses">Dépenses</TabsTrigger></TabsList>

        <TabsContent value="paiements" className="space-y-4">
          <PaiementForm commandes={commandes} onSaved={() => qc.invalidateQueries({ queryKey: ["paiements"] })} />
          <Card><CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader><CardContent className="space-y-2">
            {filteredPaiements.map((p) => {
              const cmd = commandes.find((c) => c.id === p.commande_id);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{cmd?.titre ?? "Paiement libre"}</p>
                    <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                      {formatDate(p.date_paiement)} ·
                      <Badge variant="outline">{METHODES[p.methode]}</Badge>
                      <Badge variant={p.source === "boutique" ? "secondary" : "default"}>{SOURCE_LABELS[p.source]}</Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success">+{formatMoney(Number(p.montant))}</span>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      if (!confirm("Supprimer ?")) return;
                      await supabase.from("paiements").delete().eq("id", p.id);
                      qc.invalidateQueries({ queryKey: ["paiements"] });
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
            {filteredPaiements.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucun paiement</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <DepenseForm onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
          <Card><CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader><CardContent className="space-y-2">
            {filteredDepenses.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{d.description}</p>
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                    {formatDate(d.date_depense)} ·
                    <Badge variant="outline">{CATEGORIES[d.categorie]}</Badge>
                    <Badge variant={d.source === "boutique" ? "secondary" : "default"}>{SOURCE_LABELS[d.source]}</Badge>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-destructive">-{formatMoney(Number(d.montant))}</span>
                  <Button size="icon" variant="ghost" onClick={async () => {
                    if (!confirm("Supprimer ?")) return;
                    await supabase.from("depenses").delete().eq("id", d.id);
                    qc.invalidateQueries({ queryKey: ["depenses"] });
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {filteredDepenses.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucune dépense</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaisseCard({ title, icon, data, accent }: { title: string; icon: React.ReactNode; data: { in: number; out: number; solde: number }; accent: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`flex h-8 w-8 items-center justify-center rounded-md ${accent}`}>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-success" />Entrées</span><span className="font-medium text-success">+{formatMoney(data.in)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3 text-destructive" />Sorties</span><span className="font-medium text-destructive">-{formatMoney(data.out)}</span></div>
        <div className="flex justify-between border-t pt-2"><span className="font-semibold flex items-center gap-1"><Wallet className="h-4 w-4" />Solde</span><span className={`font-bold ${data.solde >= 0 ? "text-success" : "text-destructive"}`}>{formatMoney(data.solde)}</span></div>
      </CardContent>
    </Card>
  );
}

function PaiementForm({ commandes, onSaved }: { commandes: Pick<Commande, "id" | "titre" | "prix_total">[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async (form: any) => { const { error } = await supabase.from("paiements").insert(form); if (error) throw error; },
    onSuccess: () => { setOpen(false); onSaved(); toast.success("Paiement enregistré"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Ajouter un paiement</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouveau paiement</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          m.mutate({
            commande_id: (fd.get("commande_id") as string) === "none" ? null : fd.get("commande_id"),
            montant: Number(fd.get("montant")),
            methode: fd.get("methode") || "especes",
            source: fd.get("source") || "atelier",
            date_paiement: fd.get("date_paiement") || new Date().toISOString().slice(0, 10),
            notes: String(fd.get("notes") || "") || null,
          });
        }} className="space-y-3">
          <div><Label>Caisse *</Label>
            <Select name="source" defaultValue="atelier">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="atelier">Atelier</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Commande (atelier)</Label>
            <Select name="commande_id" defaultValue="none">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucune —</SelectItem>
                {commandes.map((c) => <SelectItem key={c.id} value={c.id}>{c.titre} ({formatMoney(Number(c.prix_total))})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Montant *</Label><Input name="montant" type="number" step="0.01" required /></div>
            <div><Label>Méthode</Label>
              <Select name="methode" defaultValue="especes"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(METHODES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Date</Label><Input type="date" name="date_paiement" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          <div><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
          <DialogFooter><Button type="submit" disabled={m.isPending}>Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DepenseForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async (form: any) => { const { error } = await supabase.from("depenses").insert(form); if (error) throw error; },
    onSuccess: () => { setOpen(false); onSaved(); toast.success("Dépense enregistrée"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Ajouter une dépense</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          m.mutate({
            description: String(fd.get("description")).trim(),
            categorie: fd.get("categorie") || "autre",
            montant: Number(fd.get("montant")),
            source: fd.get("source") || "atelier",
            date_depense: fd.get("date_depense") || new Date().toISOString().slice(0, 10),
            notes: String(fd.get("notes") || "") || null,
          });
        }} className="space-y-3">
          <div><Label>Caisse *</Label>
            <Select name="source" defaultValue="atelier">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="atelier">Atelier</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Description *</Label><Input name="description" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Catégorie</Label>
              <Select name="categorie" defaultValue="autre"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant *</Label><Input name="montant" type="number" step="0.01" required /></div>
          </div>
          <div><Label>Date</Label><Input type="date" name="date_depense" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          <div><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
          <DialogFooter><Button type="submit" disabled={m.isPending}>Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
