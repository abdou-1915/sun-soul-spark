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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/lib/types";
import { formatDate } from "@/lib/types";

export const Route = createFileRoute("/clients")({ component: ClientsPage });

function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Client | null>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: Partial<Client>) => {
      if (edit) {
        const { error } = await supabase.from("clients").update(form).eq("id", edit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false); setEdit(null);
      toast.success(edit ? "Client modifié" : "Client ajouté");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client supprimé"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = clients.filter((c) =>
    [c.nom, c.telephone, c.email].some((f) => f?.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      nom: String(fd.get("nom") || "").trim(),
      telephone: String(fd.get("telephone") || "") || null,
      email: String(fd.get("email") || "") || null,
      adresse: String(fd.get("adresse") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? "s" : ""} enregistré${clients.length > 1 ? "s" : ""}`}
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />Nouveau client</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouveau"} client</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Nom *</Label><Input name="nom" required defaultValue={edit?.nom} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Téléphone</Label><Input name="telephone" defaultValue={edit?.telephone ?? ""} /></div>
                  <div><Label>Email</Label><Input name="email" type="email" defaultValue={edit?.email ?? ""} /></div>
                </div>
                <div><Label>Adresse</Label><Input name="adresse" defaultValue={edit?.adresse ?? ""} /></div>
                <div><Label>Notes</Label><Textarea name="notes" rows={3} defaultValue={edit?.notes ?? ""} /></div>
                <DialogFooter><Button type="submit" disabled={save.isPending}>Enregistrer</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="group transition hover:shadow-md">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{c.nom}</h3>
                  <p className="text-xs text-muted-foreground">Ajouté le {formatDate(c.created_at)}</p>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button size="icon" variant="ghost" onClick={() => { setEdit(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm(`Supprimer ${c.nom} ?`) && del.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {c.telephone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{c.telephone}</p>}
                {c.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{c.email}</p>}
                {c.adresse && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{c.adresse}</p>}
              </div>
              {c.notes && <p className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">{c.notes}</p>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-12 text-center text-muted-foreground">Aucun client</CardContent></Card>
        )}
      </div>
    </div>
  );
}
