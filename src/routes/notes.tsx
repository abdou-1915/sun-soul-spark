import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesDb } from "@/lib/localdb";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type Note, formatDate } from "@/lib/types";

export const Route = createFileRoute("/notes")({ component: NotesPage });

const COULEURS = [
  { v: "jaune", c: "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700" },
  { v: "rose", c: "bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700" },
  { v: "bleu", c: "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700" },
  { v: "vert", c: "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" },
  { v: "orange", c: "bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700" },
];

function NotesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Note | null>(null);
  const [couleur, setCouleur] = useState("jaune");

  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => notesDb.list(),
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      if (edit) { notesDb.update(edit.id, form); }
      else { notesDb.insert(form); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setOpen(false); setEdit(null); toast.success("Enregistré"); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => notesDb.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Supprimée"); },
  });

  const openEdit = (n: Note | null) => { setEdit(n); setCouleur(n?.couleur ?? "jaune"); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Vos pense-bêtes et idées"
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button onClick={() => openEdit(null)}><Plus className="h-4 w-4" />Nouvelle note</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouvelle"} note</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                save.mutate({ titre: String(fd.get("titre")).trim(), contenu: String(fd.get("contenu") || "") || null, couleur });
              }} className="space-y-3">
                <div><Label>Titre *</Label><Input name="titre" required defaultValue={edit?.titre} /></div>
                <div><Label>Contenu</Label><Textarea name="contenu" rows={5} defaultValue={edit?.contenu ?? ""} /></div>
                <div>
                  <Label>Couleur</Label>
                  <div className="mt-2 flex gap-2">
                    {COULEURS.map((c) => (
                      <button type="button" key={c.v} onClick={() => setCouleur(c.v)} className={`h-8 w-8 rounded-full border-2 ${c.c} ${couleur === c.v ? "ring-2 ring-primary ring-offset-2" : ""}`} />
                    ))}
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={save.isPending}>Enregistrer</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {notes.map((n) => {
          const cls = COULEURS.find((c) => c.v === n.couleur)?.c ?? COULEURS[0].c;
          return (
            <Card key={n.id} className={`group border-2 ${cls}`}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{n.titre}</h3>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(n)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => confirm("Supprimer ?") && del.mutate(n.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
                {n.contenu && <p className="whitespace-pre-wrap text-sm text-foreground/80">{n.contenu}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </CardContent>
            </Card>
          );
        })}
        {notes.length === 0 && <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-4"><CardContent className="py-12 text-center text-muted-foreground">Aucune note. Créez-en une !</CardContent></Card>}
      </div>
    </div>
  );
}
