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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type Commande, type Client, type Paiement, STATUT_LABELS, TYPE_LABELS, formatMoney, formatDate } from "@/lib/types";

export const Route = createFileRoute("/commandes")({ component: CommandesPage });

const statutColors: Record<string, string> = {
  en_attente: "bg-muted text-muted-foreground",
  en_cours: "bg-warning/20 text-warning-foreground border-warning/40",
  termine: "bg-success/20 text-success border-success/40",
  livre: "bg-primary/20 text-primary border-primary/40",
  annule: "bg-destructive/20 text-destructive border-destructive/40",
};

function CommandesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Commande | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");

  const { data: commandes = [] } = useQuery({
    queryKey: ["commandes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commandes").select("*").order("date_commande", { ascending: false });
      if (error) throw error;
      return data as Commande[];
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => (await supabase.from("clients").select("id,nom").order("nom")).data as Pick<Client, "id" | "nom">[],
  });
  const { data: paiements = [] } = useQuery({
    queryKey: ["paiements-all"],
    queryFn: async () => (await supabase.from("paiements").select("*")).data as Paiement[],
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      if (edit) { const { error } = await supabase.from("commandes").update(form).eq("id", edit.id); if (error) throw error; }
      else { const { error } = await supabase.from("commandes").insert(form); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commandes"] }); setOpen(false); setEdit(null); toast.success(edit ? "Commande modifiée" : "Commande créée"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("commandes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commandes"] }); toast.success("Supprimée"); },
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("commandes").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commandes"] }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      titre: String(fd.get("titre")).trim(),
      description: String(fd.get("description") || "") || null,
      type: fd.get("type") || "autre",
      statut: fd.get("statut") || "en_attente",
      client_id: (fd.get("client_id") as string) === "none" ? null : fd.get("client_id"),
      prix_total: Number(fd.get("prix_total") || 0),
      date_commande: fd.get("date_commande") || new Date().toISOString().slice(0, 10),
      date_livraison: (fd.get("date_livraison") as string) || null,
      notes: String(fd.get("notes") || "") || null,
    });
  };

  const filtered = filterStatut === "all" ? commandes : commandes.filter((c) => c.statut === filterStatut);
  const payeMap = paiements.reduce<Record<string, number>>((acc, p) => {
    if (p.commande_id) acc[p.commande_id] = (acc[p.commande_id] ?? 0) + Number(p.montant);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes"
        description={`${commandes.length} travaux au total`}
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Nouvelle commande</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouvelle"} commande</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Titre *</Label><Input name="titre" required defaultValue={edit?.titre} /></div>
                <div><Label>Description</Label><Textarea name="description" rows={2} defaultValue={edit?.description ?? ""} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select name="type" defaultValue={edit?.type ?? "autre"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select name="statut" defaultValue={edit?.statut ?? "en_attente"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Client</Label>
                  <Select name="client_id" defaultValue={edit?.client_id ?? "none"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucun —</SelectItem>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Prix (DZD)</Label><Input type="number" step="0.01" name="prix_total" defaultValue={edit?.prix_total ?? 0} /></div>
                  <div><Label>Date</Label><Input type="date" name="date_commande" defaultValue={edit?.date_commande ?? new Date().toISOString().slice(0, 10)} /></div>
                  <div><Label>Livraison</Label><Input type="date" name="date_livraison" defaultValue={edit?.date_livraison ?? ""} /></div>
                </div>
                <div><Label>Notes</Label><Textarea name="notes" rows={2} defaultValue={edit?.notes ?? ""} /></div>
                <DialogFooter><Button type="submit" disabled={save.isPending}>Enregistrer</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filterStatut === "all" ? "default" : "outline"} onClick={() => setFilterStatut("all")}>Tous</Button>
        {Object.entries(STATUT_LABELS).map(([k, v]) => (
          <Button key={k} size="sm" variant={filterStatut === k ? "default" : "outline"} onClick={() => setFilterStatut(k)}>{v}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const client = clients.find((x) => x.id === c.client_id);
          const paye = payeMap[c.id] ?? 0;
          const reste = Number(c.prix_total) - paye;
          return (
            <Card key={c.id} className="transition hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{c.titre}</h3>
                      <Badge variant="outline" className={statutColors[c.statut]}>{STATUT_LABELS[c.statut]}</Badge>
                      <Badge variant="secondary">{TYPE_LABELS[c.type]}</Badge>
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {client && <span>👤 {client.nom}</span>}
                      <span>📅 Commande : {formatDate(c.date_commande)}</span>
                      {c.date_livraison && <span>🚚 Livraison : {formatDate(c.date_livraison)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{formatMoney(Number(c.prix_total))}</p>
                      <p className="text-xs text-muted-foreground">
                        Payé : <span className="font-medium text-success">{formatMoney(paye)}</span>
                        {reste > 0 && <> · Reste : <span className="font-medium text-destructive">{formatMoney(reste)}</span></>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Select value={c.statut} onValueChange={(v) => updateStatut.mutate({ id: c.id, statut: v })}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => { setEdit(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => confirm("Supprimer ?") && del.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune commande</CardContent></Card>}
      </div>
    </div>
  );
}
