import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { type Paiement, type Depense, type Commande, formatMoney, formatDate } from "@/lib/types";

export const Route = createFileRoute("/finances")({ component: FinancesPage });

const CATEGORIES: Record<Depense["categorie"], string> = {
  materiaux: "Matériaux", electricite: "Électricité", loyer: "Loyer", salaire: "Salaire", transport: "Transport", autre: "Autre",
};
const METHODES = { especes: "Espèces", virement: "Virement", cheque: "Chèque", carte: "Carte" } as const;

function FinancesPage() {
  const qc = useQueryClient();
  const { data: paiements = [] } = useQuery({ queryKey: ["paiements"], queryFn: async () => (await supabase.from("paiements").select("*").order("date_paiement", { ascending: false })).data as Paiement[] });
  const { data: depenses = [] } = useQuery({ queryKey: ["depenses"], queryFn: async () => (await supabase.from("depenses").select("*").order("date_depense", { ascending: false })).data as Depense[] });
  const { data: commandes = [] } = useQuery({ queryKey: ["commandes-finances"], queryFn: async () => (await supabase.from("commandes").select("id,titre,prix_total")).data as Pick<Commande, "id" | "titre" | "prix_total">[] });

  const totalIn = paiements.reduce((s, p) => s + Number(p.montant), 0);
  const totalOut = depenses.reduce((s, d) => s + Number(d.montant), 0);
  const solde = totalIn - totalOut;

  return (
    <div className="space-y-6">
      <PageHeader title="Finances" description="Paiements reçus et dépenses" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/15 text-success"><TrendingUp className="h-6 w-6" /></div><div><p className="text-xs uppercase text-muted-foreground">Encaissé</p><p className="text-xl font-bold">{formatMoney(totalIn)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/15 text-destructive"><TrendingDown className="h-6 w-6" /></div><div><p className="text-xs uppercase text-muted-foreground">Dépenses</p><p className="text-xl font-bold">{formatMoney(totalOut)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className={`flex h-12 w-12 items-center justify-center rounded-lg ${solde >= 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}><Wallet className="h-6 w-6" /></div><div><p className="text-xs uppercase text-muted-foreground">Solde net</p><p className="text-xl font-bold">{formatMoney(solde)}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="paiements">
        <TabsList><TabsTrigger value="paiements">Paiements</TabsTrigger><TabsTrigger value="depenses">Dépenses</TabsTrigger></TabsList>

        <TabsContent value="paiements" className="space-y-4">
          <PaiementForm commandes={commandes} onSaved={() => qc.invalidateQueries({ queryKey: ["paiements"] })} />
          <Card><CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader><CardContent className="space-y-2">
            {paiements.map((p) => {
              const cmd = commandes.find((c) => c.id === p.commande_id);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{cmd?.titre ?? "Paiement libre"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.date_paiement)} · <Badge variant="outline" className="ml-1">{METHODES[p.methode]}</Badge></p>
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
            {paiements.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucun paiement</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <DepenseForm onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
          <Card><CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader><CardContent className="space-y-2">
            {depenses.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{d.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(d.date_depense)} · <Badge variant="outline">{CATEGORIES[d.categorie]}</Badge></p>
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
            {depenses.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucune dépense</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
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
            date_paiement: fd.get("date_paiement") || new Date().toISOString().slice(0, 10),
            notes: String(fd.get("notes") || "") || null,
          });
        }} className="space-y-3">
          <div><Label>Commande</Label>
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
            date_depense: fd.get("date_depense") || new Date().toISOString().slice(0, 10),
            notes: String(fd.get("notes") || "") || null,
          });
        }} className="space-y-3">
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
