import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produitsDb, clientsDb, ventesDb, venteItemsDb } from "@/lib/localdb";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { type Produit, type Vente, type VenteItem, type Client, formatMoney, formatDate } from "@/lib/types";

export const Route = createFileRoute("/boutique/ventes")({ component: VentesPage });

type CartLine = { produit: Produit; quantite: number };

function VentesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientId, setClientId] = useState<string>("none");
  const [methode, setMethode] = useState<Vente["methode_paiement"]>("especes");
  const [q, setQ] = useState("");

  const { data: produits = [] } = useQuery({ queryKey: ["produits"], queryFn: () => produitsDb.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsDb.list() });
  const { data: ventes = [] } = useQuery({ queryKey: ["ventes"], queryFn: () => ventesDb.list() });
  const { data: items = [] } = useQuery({ queryKey: ["vente_items"], queryFn: () => {
    const rows: VenteItem[] = [];
    ventes.forEach(v => rows.push(...venteItemsDb.listByVente(v.id)));
    return rows;
  }});

  const total = useMemo(() => cart.reduce((s, l) => s + Number(l.produit.prix_vente) * l.quantite, 0), [cart]);
  const filtered = produits.filter((p) => !q || p.nom.toLowerCase().includes(q.toLowerCase()) || (p.code_barre ?? "").includes(q));

  const addToCart = (p: Produit) => {
    setCart((c) => {
      const ex = c.find((l) => l.produit.id === p.id);
      if (ex) return c.map((l) => l.produit.id === p.id ? { ...l, quantite: l.quantite + 1 } : l);
      return [...c, { produit: p, quantite: 1 }];
    });
  };

  const updateQty = (id: string, qte: number) => setCart((c) => c.map((l) => l.produit.id === id ? { ...l, quantite: Math.max(1, qte) } : l));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.produit.id !== id));

  const save = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Panier vide");
      const vente = ventesDb.insert({
        client_id: clientId === "none" ? null : clientId,
        total,
        methode_paiement: methode,
        date_vente: new Date().toISOString().slice(0, 10),
        notes: null,
      });
      cart.forEach((l) => venteItemsDb.insert({
        vente_id: vente.id,
        produit_id: l.produit.id,
        nom_produit: l.produit.nom,
        quantite: l.quantite,
        prix_unitaire: l.produit.prix_vente,
      }));
      // update stock
      cart.forEach((l) => produitsDb.update(l.produit.id, { stock: Math.max(0, Number(l.produit.stock) - l.quantite) }));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["vente_items"] });
      qc.invalidateQueries({ queryKey: ["produits"] });
      setCart([]); setClientId("none"); setMethode("especes"); setOpen(false);
      toast.success("Vente enregistrée ✓");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { ventesDb.delete(id); venteItemsDb.deleteByVente(id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ventes"] }); toast.success("Vente supprimée"); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventes"
        description="Caisse comptoir & historique"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Nouvelle vente</Button></DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Nouvelle vente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Produits</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
                  </div>
                  <div className="max-h-72 space-y-1 overflow-y-auto rounded border p-2">
                    {filtered.map((p) => (
                      <button key={p.id} type="button" onClick={() => addToCart(p)}
                        className="flex w-full items-center justify-between rounded p-2 text-left text-sm transition hover:bg-accent disabled:opacity-50"
                        disabled={Number(p.stock) <= 0}>
                        <span className="min-w-0 truncate">{p.nom}<span className="ml-2 text-xs text-muted-foreground">stock: {Number(p.stock)}</span></span>
                        <span className="font-medium">{formatMoney(Number(p.prix_vente))}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Aucun produit</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Panier ({cart.length})</Label>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded border p-2">
                    {cart.map((l) => (
                      <div key={l.produit.id} className="flex items-center gap-2 rounded bg-muted/40 p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{l.produit.nom}</p>
                          <p className="text-xs text-muted-foreground">{formatMoney(Number(l.produit.prix_vente))}</p>
                        </div>
                        <Input type="number" min={1} value={l.quantite}
                          onChange={(e) => updateQty(l.produit.id, Number(e.target.value))} className="h-8 w-16" />
                        <Button size="icon" variant="ghost" onClick={() => removeLine(l.produit.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                    {cart.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Panier vide</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Client</Label>
                      <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Client de passage</SelectItem>
                          {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Paiement</Label>
                      <Select value={methode} onValueChange={(v) => setMethode(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="especes">Espèces</SelectItem>
                          <SelectItem value="carte">Carte</SelectItem>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatMoney(total)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => save.mutate()} disabled={save.isPending || cart.length === 0}>
                  <Receipt className="h-4 w-4" />Encaisser {formatMoney(total)}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardHeader><CardTitle className="text-base">Historique des ventes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ventes.map((v) => {
            const lignes = items.filter((i) => i.vente_id === v.id);
            const client = clients.find((c) => c.id === v.client_id);
            return (
              <div key={v.id} className="rounded-lg border p-3 transition hover:bg-accent/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{client?.nom ?? "Client de passage"}</span>
                      <Badge variant="outline" className="text-xs">{v.methode_paiement}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(v.date_vente)} · {lignes.length} article{lignes.length > 1 ? "s" : ""}</p>
                    {lignes.length > 0 && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {lignes.map((l) => `${l.nom_produit} ×${Number(l.quantite)}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{formatMoney(Number(v.total))}</span>
                    <Button size="icon" variant="ghost" onClick={() => confirm("Supprimer cette vente ?") && del.mutate(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {ventes.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Aucune vente pour le moment</p>}
        </CardContent>
      </Card>
    </div>
  );
}
