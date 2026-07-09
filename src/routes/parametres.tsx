import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Trash2, AlertTriangle, Download, Upload } from "lucide-react";

export const Route = createFileRoute("/parametres")({ component: Parametres });

const ALL_KEYS = [
  "clients", "commandes", "paiements", "depenses",
  "materiaux", "notes", "produits", "ventes", "vente_items",
] as const;

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
  const fileRef = useRef<HTMLInputElement>(null);

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
      for (const t of tables) localStorage.removeItem(t);
    },
    onSuccess: () => {
      toast.success("Données supprimées");
      setSelected({});
      setConfirmText("");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleExport = () => {
    try {
      const dump: Record<string, unknown> = {
        _app: "atelier-pro",
        _version: 1,
        _exportedAt: new Date().toISOString(),
      };
      for (const k of ALL_KEYS) {
        try { dump[k] = JSON.parse(localStorage.getItem(k) ?? "[]"); }
        catch { dump[k] = []; }
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `atelier-pro-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Sauvegarde exportée");
    } catch (e: any) {
      toast.error("Erreur d'export : " + e.message);
    }
  };

  const handleImport = async (file: File, mode: "replace" | "merge") => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") throw new Error("Fichier invalide");

      for (const k of ALL_KEYS) {
        if (!Array.isArray(data[k])) continue;
        if (mode === "replace") {
          localStorage.setItem(k, JSON.stringify(data[k]));
        } else {
          let existing: any[] = [];
          try { existing = JSON.parse(localStorage.getItem(k) ?? "[]"); } catch { existing = []; }
          const seen = new Set(existing.map((r: any) => r?.id).filter(Boolean));
          const merged = [...existing, ...data[k].filter((r: any) => !seen.has(r?.id))];
          localStorage.setItem(k, JSON.stringify(merged));
        }
      }
      qc.invalidateQueries();
      toast.success(mode === "replace" ? "Données restaurées" : "Données fusionnées");
    } catch (e: any) {
      toast.error("Import échoué : " + e.message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");

  const canConfirm = confirmText === "SUPPRIMER" && Object.values(selected).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Sauvegarde, restauration et maintenance" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Sauvegarde & Restauration
          </CardTitle>
          <CardDescription>
            Exportez toutes vos données dans un fichier JSON, ou importez une sauvegarde
            (utile pour transférer vos données entre appareils).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="h-4 w-4" /> Exporter mes données (.json)
          </Button>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Importer une sauvegarde</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "merge"}
                  onChange={() => setImportMode("merge")}
                />
                Fusionner (ajouter sans écraser)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                />
                Remplacer (écrase les données actuelles)
              </label>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f, importMode);
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full sm:w-auto">
              <Upload className="h-4 w-4" /> Choisir un fichier .json
            </Button>
          </div>
        </CardContent>
      </Card>

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
