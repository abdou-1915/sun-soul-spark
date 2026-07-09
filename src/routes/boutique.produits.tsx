import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produitsDb } from "@/lib/localdb";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, AlertTriangle, Smartphone, Search } from "lucide-react";
import { toast } from "sonner";
import { type Produit, formatMoney, CATEGORIE_LABELS } from "@/lib/types";

export const Route = createFileRoute("/boutique/produits")({ component: ProduitsPage });

function ProduitsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Produit | null>(null);
  const [categorie, setCategorie] = useState<string>("accessoire");
  const [q, setQ] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["produits"],
    queryFn: () => produitsDb.list(),
  });

  const filtered = items.filter((p) =>
    !q || p.nom.toLowerCase().includes(q.toLowerCase()) || (p.marque ?? "").toLowerCase().includes(q.toLowerCase()) || (p.code_barre ?? "").includes(q)
  );

  const save = useMutation({
    mutationFn: async (form: any) => {
      if (edit) { produitsDb.update(edit.id, form); }
      else { produitsDb.insert(form); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["produits"] }); setOpen(false); setEdit(null); toast.success(edit ? "Produit modifié" : "Produit ajouté"); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => produitsDb.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["produits"] }); toast.success("Supprimé"); },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      nom: String(fd.get("nom")).trim(),
      categorie,
      marque: String(fd.get("marque") || "") || null,
      code_barre: String(fd.get("code_barre") || "") || null,
      prix_achat: Number(fd.get("prix_achat") || 0),
      prix_vente: Number(fd.get("prix_vente") || 0),
      stock: Number(fd.get("stock") || 0),
      seuil_alerte: Number(fd.get("seuil_alerte") || 0),
      notes: String(fd.get("notes") || "") || null,
    });
  };

  const openNew = () => { setEdit(null); setCategorie("accessoire"); setOpen(true); };
  const openEdit = (p: Produit) => { setEdit(p); setCategorie(p.categorie); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produits"
        description={`${items.length} produit${items.length > 1 ? "s" : ""} en boutique`}
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4" />Nouveau produit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Nom *</Label><Input name="nom" required defaultValue={edit?.nom} placeholder="iPhone 14 Pro, Câble USB-C..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={categorie} onValueChange={setCategorie}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(CATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Marque</Label><Input name="marque" defaultValue={edit?.marque ?? ""} placeholder="Apple, Samsung..." /></div>
                </div>
                <div><Label>Code-barre</Label><Input name="code_barre" defaultValue={edit?.code_barre ?? ""} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prix d'achat</Label><Input name="prix_achat" type="number" step="0.01" defaultValue={edit?.prix_achat ?? 0} /></div>
                  <div><Label>Prix de vente</Label><Input name="prix_vente" type="number" step="0.01" defaultValue={edit?.prix_vente ?? 0} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Stock</Label><Input name="stock" type="number" step="1" defaultValue={edit?.stock ?? 0} /></div>
                  <div><Label>Seuil d'alerte</Label><Input name="seuil_alerte" type="number" step="1" defaultValue={edit?.seuil_alerte ?? 5} /></div>
                </div>
                <div><Label>Notes</Label><Textarea name="notes" rows={2} defaultValue={edit?.notes ?? ""} /></div>
                <DialogFooter><Button type="submit" disabled={save.isPending}>Enregistrer</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un produit, marque, code..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const low = Number(p.stock) <= Number(p.seuil_alerte);
          const marge = Number(p.prix_vente) - Number(p.prix_achat);
          return (
            <Card key={p.id} className={`group transition hover:shadow-md ${low ? "border-destructive/40" : ""}`}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{p.nom}</h3>
                      <p className="text-xs text-muted-foreground">{p.marque ?? "—"} · {CATEGORIE_LABELS[p.categorie]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Supprimer ${p.nom} ?`)) del.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold">{formatMoney(Number(p.prix_vente))}</span>
                    <span className="ml-2 text-xs text-success">+{formatMoney(marge)}</span>
                  </div>
                  {low ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{Number(p.stock)} en stock</Badge>
                       : <Badge variant="outline">{Number(p.stock)} en stock</Badge>}
                </div>
                {p.code_barre && <p className="border-t pt-2 font-mono text-xs text-muted-foreground">📊 {p.code_barre}</p>}
                {p.notes && <p className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">{p.notes}</p>}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-12 text-center text-muted-foreground">Aucun produit</CardContent></Card>}
      </div>
    </div>
  );
}
