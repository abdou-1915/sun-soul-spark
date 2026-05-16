import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paiementsDb, depensesDb, commandesDb, ventesDb } from "@/lib/localdb";
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
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Wrench, ShoppingCart, ArrowDownToLine, ArrowUpFromLine, HandCoins, UserMinus, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import {
  type Paiement, type Depense, type Commande, type Vente, type Source,
  type PaiementCategorie, type DepenseCategorie,
  formatMoney, formatDate, SOURCE_LABELS,
  PAIEMENT_CATEGORIE_LABELS, DEPENSE_CATEGORIE_LABELS,
} from "@/lib/types";

export const Route = createFileRoute("/finances")({ component: FinancesPage });

const METHODES = { especes: "Espèces", virement: "Virement", cheque: "Chèque", carte: "Carte" } as const;
type SourceFilter = "tout" | Source;

function FinancesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<SourceFilter>("tout");

  const { data: paiements = [] } = useQuery({ queryKey: ["paiements"], queryFn: () => paiementsDb.list() });
  const { data: depenses = [] } = useQuery({ queryKey: ["depenses"], queryFn: () => depensesDb.list() });
  const { data: commandes = [] } = useQuery({ queryKey: ["commandes-finances"], queryFn: () => commandesDb.list().map(c => ({ id: c.id, titre: c.titre, prix_total: c.prix_total })) });
  const { data: ventes = [] } = useQuery({ queryKey: ["ventes-finances"], queryFn: () => ventesDb.list() });

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

  const fp = filter === "tout" ? paiements : paiements.filter(p => p.source === filter);
  const fd = filter === "tout" ? depenses : depenses.filter(d => d.source === filter);

  const entrees = fp;
  const sorties = fd.filter(d => !["dette_payee", "pret_accorde", "prelevement_personnel", "retrait"].includes(d.categorie));
  const retraits = fd.filter(d => d.categorie === "retrait");
  const prelevements = fd.filter(d => d.categorie === "prelevement_personnel");
  const apports = fp.filter(p => p.categorie === "apport");

  const detteRecue = fp.filter(p => p.categorie === "dette_recue").reduce((s, p) => s + Number(p.montant), 0);
  const dettePayee = fd.filter(d => d.categorie === "dette_payee").reduce((s, d) => s + Number(d.montant), 0);
  const pretAccorde = fd.filter(d => d.categorie === "pret_accorde").reduce((s, d) => s + Number(d.montant), 0);
  const remboursementRecu = fp.filter(p => p.categorie === "remboursement_recu").reduce((s, p) => s + Number(p.montant), 0);
  const dettesNetto = detteRecue - dettePayee;
  const pretsNetto = pretAccorde - remboursementRecu;

  const deletePaiement = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    paiementsDb.delete(id);
    qc.invalidateQueries({ queryKey: ["paiements"] });
  };

  const deleteDepense = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    depensesDb.delete(id);
    qc.invalidateQueries({ queryKey: ["depenses"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Caisse & Finances" description="Toute la trésorerie en un seul endroit" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CaisseCard title="Caisse Atelier" icon={<Wrench className="h-5 w-5" />} data={caisses.atelier} accent="bg-primary/15 text-primary" />
        <CaisseCard title="Caisse Boutique" icon={<ShoppingCart className="h-5 w-5" />} data={caisses.boutique} accent="bg-accent/30 text-accent-foreground" />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm">Caisse :</Label>
        <Select value={filter} onValueChange={(v) => setFilter(v as SourceFilter)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tout">Tout</SelectItem>
            <SelectItem value="atelier">Atelier</SelectItem>
            <SelectItem value="boutique">Boutique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="entrees" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto">
          <TabsTrigger value="entrees"><ArrowDownToLine className="h-4 w-4 mr-1" />Entrées</TabsTrigger>
          <TabsTrigger value="sorties"><ArrowUpFromLine className="h-4 w-4 mr-1" />Dépenses</TabsTrigger>
          <TabsTrigger value="retraits"><Wallet className="h-4 w-4 mr-1" />Retraits</TabsTrigger>
          <TabsTrigger value="perso"><UserMinus className="h-4 w-4 mr-1" />Perso</TabsTrigger>
          <TabsTrigger value="apports"><PiggyBank className="h-4 w-4 mr-1" />Apports</TabsTrigger>
          <TabsTrigger value="dettes"><HandCoins className="h-4 w-4 mr-1" />Dettes</TabsTrigger>
        </TabsList>

        <TabsContent value="entrees" className="space-y-4 mt-4">
          <PaiementForm commandes={commandes} onSaved={() => qc.invalidateQueries({ queryKey: ["paiements"] })} />
          <PaiementList items={entrees} commandes={commandes} onDelete={deletePaiement} />
        </TabsContent>
        <TabsContent value="sorties" className="space-y-4 mt-4">
          <DepenseForm defaultCat="autre" label="Ajouter une dépense" onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
          <DepenseList items={sorties} onDelete={deleteDepense} />
        </TabsContent>
        <TabsContent value="retraits" className="space-y-4 mt-4">
          <DepenseForm defaultCat="retrait" label="Ajouter un retrait" onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
          <DepenseList items={retraits} onDelete={deleteDepense} />
        </TabsContent>
        <TabsContent value="perso" className="space-y-4 mt-4">
          <DepenseForm defaultCat="prelevement_personnel" label="Prélèvement personnel" onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
          <DepenseList items={prelevements} onDelete={deleteDepense} />
        </TabsContent>
        <TabsContent value="apports" className="space-y-4 mt-4">
          <PaiementForm commandes={commandes} defaultCat="apport" label="Ajouter un apport" onSaved={() => qc.invalidateQueries({ queryKey: ["paiements"] })} />
          <PaiementList items={apports} commandes={commandes} onDelete={deletePaiement} />
        </TabsContent>
        <TabsContent value="dettes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card><CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Je dois (emprunté)</p>
              <p className="text-2xl font-bold text-destructive">{formatMoney(Math.max(0, dettesNetto))}</p>
              <p className="text-xs text-muted-foreground">Reçu {formatMoney(detteRecue)} · Payé {formatMoney(dettePayee)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">On me doit (prêté)</p>
              <p className="text-2xl font-bold text-success">{formatMoney(Math.max(0, pretsNetto))}</p>
              <p className="text-xs text-muted-foreground">Prêté {formatMoney(pretAccorde)} · Remboursé {formatMoney(remboursementRecu)}</p>
            </CardContent></Card>
          </div>
          <div className="flex flex-wrap gap-2">
            <PaiementForm commandes={commandes} defaultCat="dette_recue" label="J'ai emprunté" onSaved={() => qc.invalidateQueries({ queryKey: ["paiements"] })} />
            <DepenseForm defaultCat="dette_payee" label="J'ai remboursé" onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
            <DepenseForm defaultCat="pret_accorde" label="J'ai prêté" onSaved={() => qc.invalidateQueries({ queryKey: ["depenses"] })} />
            <PaiementForm commandes={commandes} defaultCat="remboursement_recu" label="On m'a remboursé" onSaved={() => qc.invalidateQueries({ queryKey: ["paiements"] })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaiementList({ items, commandes, onDelete }: { items: Paiement[]; commandes: Pick<Commande, "id" | "titre" | "prix_total">[]; onDelete: (id: string) => void }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader><CardContent className="space-y-2">
      {items.map((p) => {
        const cmd = commandes.find((c) => c.id === p.commande_id);
        return (
          <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{cmd?.titre ?? PAIEMENT_CATEGORIE_LABELS[p.categorie] ?? "Entrée"}</p>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                {formatDate(p.date_paiement)} ·
                <Badge variant="outline">{PAIEMENT_CATEGORIE_LABELS[p.categorie]}</Badge>
                <Badge variant={p.source === "boutique" ? "secondary" : "default"}>{SOURCE_LABELS[p.source]}</Badge>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-success">+{formatMoney(Number(p.montant))}</span>
              <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucune entrée</p>}
    </CardContent></Card>
  );
}

function DepenseList({ items, onDelete }: { items: Depense[]; onDelete: (id: string) => void }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader><CardContent className="space-y-2">
      {items.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{d.description}</p>
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
              {formatDate(d.date_depense)} ·
              <Badge variant="outline">{DEPENSE_CATEGORIE_LABELS[d.categorie] ?? d.categorie}</Badge>
              <Badge variant={d.source === "boutique" ? "secondary" : "default"}>{SOURCE_LABELS[d.source]}</Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-destructive">-{formatMoney(Number(d.montant))}</span>
            <Button size="icon" variant="ghost" onClick={() => onDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucune dépense</p>}
    </CardContent></Card>
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

function PaiementForm({ commandes, onSaved, defaultCat = "vente", label = "Ajouter une entrée" }: { commandes: Pick<Commande, "id" | "titre" | "prix_total">[]; onSaved: () => void; defaultCat?: PaiementCategorie; label?: string }) {
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async (form: any) => paiementsDb.insert(form),
    onSuccess: () => { setOpen(false); onSaved(); toast.success("Enregistré"); },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" />{label}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          m.mutate({
            commande_id: (fd.get("commande_id") as string) === "none" ? null : fd.get("commande_id"),
            montant: Number(fd.get("montant")),
            methode: fd.get("methode") || "especes",
            source: fd.get("source") || "atelier",
            categorie: fd.get("categorie") || defaultCat,
            date_paiement: fd.get("date_paiement") || new Date().toISOString().slice(0, 10),
            notes: String(fd.get("notes") || "") || null,
          });
        }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Caisse *</Label>
              <Select name="source" defaultValue="atelier"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="atelier">Atelier</SelectItem><SelectItem value="boutique">Boutique</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Catégorie *</Label>
              <Select name="categorie" defaultValue={defaultCat}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PAIEMENT_CATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Commande liée (optionnel)</Label>
            <Select name="commande_id" defaultValue="none"><SelectTrigger><SelectValue /></SelectTrigger>
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

function DepenseForm({ onSaved, defaultCat = "autre", label = "Ajouter une dépense" }: { onSaved: () => void; defaultCat?: DepenseCategorie; label?: string }) {
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async (form: any) => depensesDb.insert(form),
    onSuccess: () => { setOpen(false); onSaved(); toast.success("Enregistré"); },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={defaultCat === "autre" ? "default" : "outline"}><Plus className="h-4 w-4" />{label}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          m.mutate({
            description: String(fd.get("description")).trim(),
            categorie: fd.get("categorie") || defaultCat,
            montant: Number(fd.get("montant")),
            source: fd.get("source") || "atelier",
            date_depense: fd.get("date_depense") || new Date().toISOString().slice(0, 10),
            notes: String(fd.get("notes") || "") || null,
          });
        }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Caisse *</Label>
              <Select name="source" defaultValue="atelier"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="atelier">Atelier</SelectItem><SelectItem value="boutique">Boutique</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Catégorie *</Label>
              <Select name="categorie" defaultValue={defaultCat}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DEPENSE_CATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Description *</Label><Input name="description" required defaultValue={DEPENSE_CATEGORIE_LABELS[defaultCat]} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Montant *</Label><Input name="montant" type="number" step="0.01" required /></div>
            <div><Label>Date</Label><Input type="date" name="date_depense" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          </div>
          <div><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
          <DialogFooter><Button type="submit" disabled={m.isPending}>Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
