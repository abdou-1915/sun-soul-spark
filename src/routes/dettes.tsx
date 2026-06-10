import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { depensesDb, paiementsDb } from "@/lib/localdb";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HandCoins, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  type Paiement,
  type Depense,
  type PaiementCategorie,
  type DepenseCategorie,
  type Source,
  formatDate,
  formatMoney,
  SOURCE_LABELS,
} from "@/lib/types";

export const Route = createFileRoute("/dettes")({ component: DettesPage });

type DetteType = "dette_recue" | "dette_payee" | "pret_accorde" | "remboursement_recu";
type DetteItem = {
  id: string;
  kind: "paiement" | "depense";
  type: DetteType;
  date: string;
  montant: number;
  source: "atelier" | "boutique";
  note: string;
};

type DetteFormData = {
  montant: number;
  source: Source;
  date: string;
  note: string;
};

const typeLabels: Record<DetteType, string> = {
  dette_recue: "J'ai emprunté",
  dette_payee: "J'ai remboursé",
  pret_accorde: "J'ai prêté",
  remboursement_recu: "On m'a remboursé",
};

function DettesPage() {
  const qc = useQueryClient();
  const { data: paiements = [] } = useQuery({
    queryKey: ["paiements"],
    queryFn: () => paiementsDb.list(),
  });
  const { data: depenses = [] } = useQuery({
    queryKey: ["depenses"],
    queryFn: () => depensesDb.list(),
  });

  const items = useMemo<DetteItem[]>(() => {
    const inItems = paiements
      .filter((p) => p.categorie === "dette_recue" || p.categorie === "remboursement_recu")
      .map((p) => ({
        id: p.id,
        kind: "paiement" as const,
        type: p.categorie as DetteType,
        date: p.date_paiement,
        montant: Number(p.montant),
        source: p.source,
        note: p.notes ?? "",
      }));
    const outItems = depenses
      .filter((d) => d.categorie === "dette_payee" || d.categorie === "pret_accorde")
      .map((d) => ({
        id: d.id,
        kind: "depense" as const,
        type: d.categorie as DetteType,
        date: d.date_depense,
        montant: Number(d.montant),
        source: d.source,
        note: d.notes ?? d.description,
      }));
    return [...inItems, ...outItems].sort((a, b) => b.date.localeCompare(a.date));
  }, [paiements, depenses]);

  const totals = useMemo(() => {
    const emprunte = items
      .filter((i) => i.type === "dette_recue")
      .reduce((s, i) => s + i.montant, 0);
    const rembourse = items
      .filter((i) => i.type === "dette_payee")
      .reduce((s, i) => s + i.montant, 0);
    const prete = items.filter((i) => i.type === "pret_accorde").reduce((s, i) => s + i.montant, 0);
    const recu = items
      .filter((i) => i.type === "remboursement_recu")
      .reduce((s, i) => s + i.montant, 0);
    return {
      jeDois: Math.max(0, emprunte - rembourse),
      onMeDoit: Math.max(0, prete - recu),
      emprunte,
      rembourse,
      prete,
      recu,
    };
  }, [items]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["paiements"] });
    qc.invalidateQueries({ queryKey: ["depenses"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const remove = (item: DetteItem) => {
    if (item.kind === "paiement") paiementsDb.delete(item.id);
    else depensesDb.delete(item.id);
    invalidate();
    toast.success("Dette supprimée");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dettes"
        description="Gestion séparée des emprunts, prêts et remboursements"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DebtSummary
          title="Je dois"
          value={totals.jeDois}
          details={`Emprunté ${formatMoney(totals.emprunte)} · Remboursé ${formatMoney(totals.rembourse)}`}
          negative
        />
        <DebtSummary
          title="On me doit"
          value={totals.onMeDoit}
          details={`Prêté ${formatMoney(totals.prete)} · Reçu ${formatMoney(totals.recu)}`}
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-2 p-4 sm:flex">
          <DebtForm type="dette_recue" onSaved={invalidate} />
          <DebtForm type="dette_payee" onSaved={invalidate} />
          <DebtForm type="pret_accorde" onSaved={invalidate} />
          <DebtForm type="remboursement_recu" onSaved={invalidate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="h-4 w-4" />
            Historique des dettes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <DebtRow
              key={`${item.kind}-${item.id}`}
              item={item}
              onSaved={invalidate}
              onDelete={() => remove(item)}
            />
          ))}
          {items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune dette enregistrée
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DebtSummary({
  title,
  value,
  details,
  negative,
}: {
  title: string;
  value: number;
  details: string;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${negative ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}
        >
          <HandCoins className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
          <p
            className={`overflow-x-auto whitespace-nowrap text-xl font-bold ${negative ? "text-destructive" : "text-success"}`}
          >
            {formatMoney(value)}
          </p>
          <p className="text-xs text-muted-foreground">{details}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DebtRow({
  item,
  onSaved,
  onDelete,
}: {
  item: DetteItem;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const isIn = item.type === "dette_recue" || item.type === "remboursement_recu";
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{typeLabels[item.type]}</p>
        {item.note && (
          <p className="mt-0.5 text-xs text-foreground/80 break-words">{item.note}</p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {formatDate(item.date)}
          <Badge variant="outline">{SOURCE_LABELS[item.source]}</Badge>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span
          className={`max-w-[96px] overflow-x-auto whitespace-nowrap text-sm font-bold sm:max-w-none ${isIn ? "text-success" : "text-destructive"}`}
        >
          {isIn ? "+" : "-"}
          {formatMoney(item.montant)}
        </span>
        <DebtForm item={item} type={item.type} onSaved={onSaved} edit />
        <DeleteDetteButton onConfirm={onDelete} />
      </div>
    </div>
  );
}

function DebtForm({
  type,
  onSaved,
  item,
  edit,
}: {
  type: DetteType;
  onSaved: () => void;
  item?: DetteItem;
  edit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isPaiement = type === "dette_recue" || type === "remboursement_recu";
  const m = useMutation({
    mutationFn: async (form: DetteFormData) => {
      if (isPaiement) {
        const payload: Partial<Paiement> = {
          montant: form.montant,
          source: form.source,
          categorie: type as PaiementCategorie,
          date_paiement: form.date,
          methode: "especes",
          notes: form.note || null,
          commande_id: null,
        };
        if (item) paiementsDb.update(item.id, payload);
        else paiementsDb.insert(payload as Omit<Paiement, "id">);
      } else {
        const payload: Partial<Depense> = {
          montant: form.montant,
          source: form.source,
          categorie: type as DepenseCategorie,
          date_depense: form.date,
          description: typeLabels[type],
          notes: form.note || null,
        };
        if (item) depensesDb.update(item.id, payload);
        else depensesDb.insert(payload as Omit<Depense, "id">);
      }
    },
    onSuccess: () => {
      setOpen(false);
      onSaved();
      toast.success(edit ? "Dette modifiée" : "Dette ajoutée");
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={edit ? "icon" : "sm"} variant={edit ? "ghost" : "default"}>
          {edit ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {typeLabels[type]}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {edit ? "Modifier" : "Ajouter"} — {typeLabels[type]}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            m.mutate({
              montant: Number(fd.get("montant")),
              source: (fd.get("source") || "atelier") as Source,
              date: String(fd.get("date") || new Date().toISOString().slice(0, 10)),
              note: String(fd.get("note") || ""),
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Caisse</Label>
              <Select name="source" defaultValue={item?.source ?? "atelier"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atelier">Atelier</SelectItem>
                  <SelectItem value="boutique">Boutique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                name="date"
                defaultValue={item?.date ?? new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
          <div>
            <Label>Montant *</Label>
            <Input
              name="montant"
              type="number"
              step="0.01"
              required
              defaultValue={item?.montant ?? ""}
            />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea
              name="note"
              rows={2}
              defaultValue={item?.note ?? ""}
              placeholder="Nom de la personne ou détail"
            />
          </div>
          <Button type="submit" disabled={m.isPending} className="w-full">
            {edit ? "Enregistrer la modification" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDetteButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[92vw] rounded-lg sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette dette ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
