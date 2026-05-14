import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { type Materiau, formatMoney } from "@/lib/types";

export const Route = createFileRoute("/materiaux")({ component: MateriauxPage });

function MateriauxPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Materiau | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["materiaux"],
    queryFn: async () => (await supabase.from("materiaux").select("*").order("nom")).data as Materiau[],
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      if (edit) { const { error } = await supabase.from("materiaux").update(form).eq("id", edit.id); if (error) throw error; }
      else { const { error } = await supabase.from("materiaux").insert(form); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materiaux"] }); setOpen(false); setEdit(null); toast.success(edit ? "Matériau modifié" : "Matériau ajouté"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("materiaux").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materiaux"] }); toast.success("Supprimé"); },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      nom: String(fd.get("nom")).trim(),
      unite: String(fd.get("unite") || "unité"),
      quantite: Number(fd.get("quantite") || 0),
      seuil_alerte: Number(fd.get("seuil_alerte") || 0),
      prix_unitaire: Number(fd.get("prix_unitaire") || 0),
      fournisseur: String(fd.get("fournisseur") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matériaux"
        description={`${items.length} article${items.length > 1 ? "s" : ""} en stock`}
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Nouveau matériau</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouveau"} matériau</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Nom *</Label><Input name="nom" required defaultValue={edit?.nom} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Unité</Label><Input name="unite" placeholder="m, kg, unité..." defaultValue={edit?.unite ?? "unité"} /></div>
                  <div><Label>Prix unitaire</Label><Input name="prix_unitaire" type="number" step="0.01" defaultValue={edit?.prix_unitaire ?? 0} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Quantité</Label><Input name="quantite" type="number" step="0.001" defaultValue={edit?.quantite ?? 0} /></div>
                  <div><Label>Seuil d'alerte</Label><Input name="seuil_alerte" type="number" step="0.001" defaultValue={edit?.seuil_alerte ?? 0} /></div>
                </div>
                <div><Label>Fournisseur</Label><Input name="fournisseur" defaultValue={edit?.fournisseur ?? ""} /></div>
                <div><Label>Notes</Label><Textarea name="notes" rows={2} defaultValue={edit?.notes ?? ""} /></div>
                <DialogFooter><Button type="submit" disabled={save.isPending}>Enregistrer</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => {
          const low = Number(m.quantite) <= Number(m.seuil_alerte);
          return (
            <Card key={m.id} className={`group transition hover:shadow-md ${low ? "border-destructive/40" : ""}`}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                    <h3 className="truncate font-semibold">{m.nom}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => confirm(`Supprimer ${m.nom} ?`) && del.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold">{Number(m.quantite)}</span>
                    <span className="ml-1 text-sm text-muted-foreground">{m.unite}</span>
                  </div>
                  {low && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Stock bas</Badge>}
                </div>
                <div className="flex justify-between border-t pt-2 text-xs text-muted-foreground">
                  <span>Seuil : {m.seuil_alerte} {m.unite}</span>
                  <span>{formatMoney(Number(m.prix_unitaire))} / {m.unite}</span>
                </div>
                {m.fournisseur && <p className="text-xs text-muted-foreground">📦 {m.fournisseur}</p>}
                {m.notes && <p className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">{m.notes}</p>}
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-12 text-center text-muted-foreground">Aucun matériau</CardContent></Card>}
      </div>
    </div>
  );
}
