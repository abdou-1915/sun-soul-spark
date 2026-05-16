import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/parametres")({ component: Parametres });

const GROUPS = [
  { key: "finances", label: "Finances (paiements & dépenses)", tables: ["paiements", "depenses"] },
  { key: "commandes", label: "Commandes", tables: ["commandes"] },
  { key: "clients", label: "Clients", tables: ["clients"] },
  { key: "materiaux", label: "Matériaux", tables: ["materiaux"] },
  { key: "notes", label: "Notes", tables: ["notes"] },
  { key: "boutique", label: "Boutique (produits & ventes)", tables: ["vente_items", "ventes", "produits"] },
] as const;

function Parametres() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmText, setConfirmText] = useState("");

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  const allKeys = GROUPS.map((g) => g.key);
  const allSelected = allKeys.every((k) => selected[k]);
  const toggleAll = () => {
    const v = !allSelected;
    setSelected(Object.fromEntries(allKeys.map((k) => [k, v])));
  };

  const reset = useMutation({
    mutationFn: async () => {
      const tables = GROUPS.filter((g) => selected[g.key]).flatMap((g) => g.tables);
      if (tables.length === 0) throw new Error("Sélectionnez au moins une catégorie");
      for (const t of tables) {
        const { error } = await supabase.from(t as any).delete().not("id", "is", null);
        if (error) throw new Error(`${t}: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast.success("Données supprimées");
      setSelected({});
      setConfirmText("");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const canConfirm = confirmText === "SUPPRIMER" && Object.values(selected).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Gestion et maintenance de vos données" />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Zone dangereuse
          </CardTitle>
          <CardDescription>
            Sélectionnez les catégories de données à supprimer définitivement. Cette action est irréversible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Checkbox id="all" checked={allSelected} onCheckedChange={toggleAll} />
            <Label htmlFor="all" className="font-semibold cursor-pointer">Tout sélectionner</Label>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {GROUPS.map((g) => (
              <div key={g.key} className="flex items-center gap-2 rounded-md border p-3">
                <Checkbox id={g.key} checked={!!selected[g.key]} onCheckedChange={() => toggle(g.key)} />
                <Label htmlFor={g.key} className="cursor-pointer flex-1">{g.label}</Label>
              </div>
            ))}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!Object.values(selected).some(Boolean)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" /> Réinitialiser les données sélectionnées
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de supprimer définitivement toutes les données des catégories sélectionnées.
                  Tapez <strong>SUPPRIMER</strong> ci-dessous pour confirmer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!canConfirm || reset.isPending}
                  onClick={(e) => { e.preventDefault(); if (canConfirm) reset.mutate(); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {reset.isPending ? "Suppression..." : "Supprimer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
