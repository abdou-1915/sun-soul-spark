import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paiementsDb, depensesDb, ventesDb } from "@/lib/localdb";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Wrench,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Paiement,
  type Depense,
  type Source,
  type PaiementCategorie,
  type DepenseCategorie,
  formatMoney,
  formatDate,
  SOURCE_LABELS,
  PAIEMENT_CATEGORIE_LABELS,
  DEPENSE_CATEGORIE_LABELS,
} from "@/lib/types";

export const Route = createFileRoute("/finances")({ component: FinancesPage });

const METHODES = {
  especes: "Espèces",
  virement: "Virement",
  cheque: "Chèque",
  carte: "Carte",
} as const;
type SourceFilter = "tout" | Source;

const dettePaiementCategories: PaiementCategorie[] = ["dette_recue", "remboursement_recu"];
const detteDepenseCategories: DepenseCategorie[] = ["dette_payee", "pret_accorde"];
type PaiementFormData = Omit<Paiement, "id">;
type DepenseFormData = Omit<Depense, "id">;

function FinancesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<SourceFilter>("tout");

  const { data: paiements = [] } = useQuery({
    queryKey: ["paiements"],
    queryFn: () => paiementsDb.list(),
  });
  const { data: depenses = [] } = useQuery({
    queryKey: ["depenses"],
    queryFn: () => depensesDb.list(),
  });
  const { data: ventes = [] } = useQuery({
    queryKey: ["ventes-finances"],
    queryFn: () => ventesDb.list(),
  });

  const financePaiements = paiements.filter((p) => !dettePaiementCategories.includes(p.categorie));
  const financeDepenses = depenses.filter((d) => !detteDepenseCategories.includes(d.categorie));
  const fp =
    filter === "tout" ? financePaiements : financePaiements.filter((p) => p.source === filter);
  const fd =
    filter === "tout" ? financeDepenses : financeDepenses.filter((d) => d.source === filter);

  const caisses = useMemo(() => {
    const atelierIn = financePaiements
      .filter((p) => p.source === "atelier")
      .reduce((s, p) => s + Number(p.montant), 0);
    const atelierOut = financeDepenses
      .filter((d) => d.source === "atelier")
      .reduce((s, d) => s + Number(d.montant), 0);
    const boutiqueIn =
      financePaiements
        .filter((p) => p.source === "boutique")
        .reduce((s, p) => s + Number(p.montant), 0) +
      ventes.reduce((s, v) => s + Number(v.total), 0);
    const boutiqueOut = financeDepenses
      .filter((d) => d.source === "boutique")
      .reduce((s, d) => s + Number(d.montant), 0);
    return {
      atelier: { in: atelierIn, out: atelierOut, solde: atelierIn - atelierOut },
      boutique: { in: boutiqueIn, out: boutiqueOut, solde: boutiqueIn - boutiqueOut },
    };
  }, [financePaiements, financeDepenses, ventes]);

  const deletePaiement = (id: string) => {
    paiementsDb.delete(id);
    qc.invalidateQueries({ queryKey: ["paiements"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("Entrée supprimée");
  };

  const deleteDepense = (id: string) => {
    depensesDb.delete(id);
    qc.invalidateQueries({ queryKey: ["depenses"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("Dépense supprimée");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Finances" description="Caisse Atelier et Boutique, sans les dettes" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CaisseCard
          title="Caisse Atelier"
          icon={<Wrench className="h-5 w-5" />}
          data={caisses.atelier}
          accent="bg-primary/15 text-primary"
        />
        <CaisseCard
          title="Caisse Boutique"
          icon={<ShoppingCart className="h-5 w-5" />}
          data={caisses.boutique}
          accent="bg-accent/30 text-accent-foreground"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Caisse</Label>
            <Select value={filter} onValueChange={(v) => setFilter(v as SourceFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Tout</SelectItem>
                <SelectItem value="atelier">Atelier</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <PaiementForm
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["paiements"] });
                qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
            <DepenseForm
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["depenses"] });
                qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PaiementList items={fp} onDelete={deletePaiement} />
        <DepenseList items={fd} onDelete={deleteDepense} />
      </div>
    </div>
  );
}

function PaiementList({ items, onDelete }: { items: Paiement[]; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowDownToLine className="h-4 w-4 text-success" />
          Entrées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{PAIEMENT_CATEGORIE_LABELS[p.categorie] ?? "Entrée"}</p>
              {p.notes && (
                <p className="mt-0.5 text-xs text-foreground/80 break-words">{p.notes}</p>
              )}
              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {formatDate(p.date_paiement)}
                <Badge variant="outline">{SOURCE_LABELS[p.source]}</Badge>
                <Badge variant="secondary">{METHODES[p.methode]}</Badge>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="max-w-[100px] overflow-x-auto whitespace-nowrap text-sm font-bold text-success sm:max-w-none">
                +{formatMoney(Number(p.montant))}
              </span>
              <DeleteButton title="Supprimer cette entrée ?" onConfirm={() => onDelete(p.id)} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune entrée</p>
        )}
      </CardContent>
    </Card>
  );
}

function DepenseList({ items, onDelete }: { items: Depense[]; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          Dépenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="break-words font-medium">{d.description}</p>
              {d.notes && (
                <p className="mt-0.5 text-xs text-foreground/80 break-words">{d.notes}</p>
              )}
              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {formatDate(d.date_depense)}
                <Badge variant="outline">
                  {DEPENSE_CATEGORIE_LABELS[d.categorie] ?? d.categorie}
                </Badge>
                <Badge variant="secondary">{SOURCE_LABELS[d.source]}</Badge>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="max-w-[100px] overflow-x-auto whitespace-nowrap text-sm font-bold text-destructive sm:max-w-none">
                -{formatMoney(Number(d.montant))}
              </span>
              <DeleteButton title="Supprimer cette dépense ?" onConfirm={() => onDelete(d.id)} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune dépense</p>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteButton({ title, onConfirm }: { title: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[92vw] rounded-lg sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
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

function CaisseCard({
  title,
  icon,
  data,
  accent,
}: {
  title: string;
  icon: ReactNode;
  data: { in: number; out: number; solde: number };
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`flex h-8 w-8 items-center justify-center rounded-md ${accent}`}>
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <MoneyRow label="Entrées" value={data.in} positive />
        <MoneyRow label="Sorties" value={data.out} negative />
        <div className="border-t pt-2">
          <MoneyRow label="Solde" value={data.solde} strong />
        </div>
      </CardContent>
    </Card>
  );
}

function MoneyRow({
  label,
  value,
  positive,
  negative,
  strong,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
  strong?: boolean;
}) {
  const cls =
    value < 0 || negative
      ? "text-destructive"
      : positive || value >= 0
        ? "text-success"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span
        className={`max-w-[170px] overflow-x-auto whitespace-nowrap text-right ${strong ? "font-bold" : "font-medium"} ${cls}`}
      >
        {positive ? "+" : negative ? "-" : ""}
        {formatMoney(Math.abs(value))}
      </span>
    </div>
  );
}

function PaiementForm({
  onSaved,
  defaultCat = "vente",
  label = "Ajouter une entrée",
}: {
  onSaved: () => void;
  defaultCat?: PaiementCategorie;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async (form: PaiementFormData) => paiementsDb.insert(form),
    onSuccess: () => {
      setOpen(false);
      onSaved();
      toast.success("Entrée enregistrée");
    },
  });
  return (
    <DialogButton open={open} setOpen={setOpen} label={label}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          m.mutate({
            commande_id: null,
            montant: Number(fd.get("montant")),
            methode: (fd.get("methode") || "especes") as Paiement["methode"],
            source: (fd.get("source") || "atelier") as Source,
            categorie: (fd.get("categorie") || defaultCat) as PaiementCategorie,
            date_paiement: String(fd.get("date_paiement") || new Date().toISOString().slice(0, 10)),
            notes: String(fd.get("notes") || "") || null,
          });
        }}
        className="space-y-3"
      >
        <FinanceFields defaultCat={defaultCat} type="in" />
        <Button type="submit" disabled={m.isPending} className="w-full">
          Enregistrer
        </Button>
      </form>
    </DialogButton>
  );
}

function DepenseForm({
  onSaved,
  defaultCat = "autre",
  label = "Ajouter une dépense",
}: {
  onSaved: () => void;
  defaultCat?: DepenseCategorie;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async (form: DepenseFormData) => depensesDb.insert(form),
    onSuccess: () => {
      setOpen(false);
      onSaved();
      toast.success("Dépense enregistrée");
    },
  });
  return (
    <DialogButton open={open} setOpen={setOpen} label={label} variant="outline">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          m.mutate({
            description: String(fd.get("description")).trim(),
            categorie: (fd.get("categorie") || defaultCat) as DepenseCategorie,
            montant: Number(fd.get("montant")),
            source: (fd.get("source") || "atelier") as Source,
            date_depense: String(fd.get("date_depense") || new Date().toISOString().slice(0, 10)),
            notes: String(fd.get("notes") || "") || null,
          });
        }}
        className="space-y-3"
      >
        <FinanceFields defaultCat={defaultCat} type="out" />
        <div>
          <Label>Description *</Label>
          <Input name="description" required defaultValue={DEPENSE_CATEGORIE_LABELS[defaultCat]} />
        </div>
        <Button type="submit" disabled={m.isPending} className="w-full">
          Enregistrer
        </Button>
      </form>
    </DialogButton>
  );
}

function DialogButton({
  open,
  setOpen,
  label,
  variant = "default",
  children,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  label: string;
  variant?: "default" | "outline";
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant}>
          <Plus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function FinanceFields({
  defaultCat,
  type,
}: {
  defaultCat: PaiementCategorie | DepenseCategorie;
  type: "in" | "out";
}) {
  const catLabels = type === "in" ? PAIEMENT_CATEGORIE_LABELS : DEPENSE_CATEGORIE_LABELS;
  const entries = Object.entries(catLabels).filter(
    ([k]) => !["dette_recue", "remboursement_recu", "dette_payee", "pret_accorde"].includes(k),
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Caisse *</Label>
          <Select name="source" defaultValue="atelier">
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
          <Label>Catégorie *</Label>
          <Select name="categorie" defaultValue={defaultCat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entries.map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Montant *</Label>
          <Input name="montant" type="number" step="0.01" required />
        </div>
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            name={type === "in" ? "date_paiement" : "date_depense"}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>
      {type === "in" && (
        <div>
          <Label>Méthode</Label>
          <Select name="methode" defaultValue="especes">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METHODES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Notes</Label>
        <Textarea name="notes" rows={2} />
      </div>
    </>
  );
}
