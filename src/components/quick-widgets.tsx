import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commandesDb, clientsDb, paiementsDb, depensesDb } from "@/lib/localdb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Wallet, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  TYPE_LABELS,
  PAIEMENT_CATEGORIE_LABELS,
  DEPENSE_CATEGORIE_LABELS,
  type CommandeType,
  type Source,
  type PaiementCategorie,
  type DepenseCategorie,
} from "@/lib/types";

export function QuickCommandeWidget() {
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-quick"],
    queryFn: () => clientsDb.list().map((c) => ({ id: c.id, nom: c.nom })),
  });
  const [titre, setTitre] = useState("");
  const [type, setType] = useState("autre");
  const [prix, setPrix] = useState("");
  const [clientId, setClientId] = useState("none");

  const m = useMutation({
    mutationFn: async () => {
      if (!titre.trim()) throw new Error("Titre requis");
      commandesDb.insert({
        titre: titre.trim(),
        type: type as CommandeType,
        prix_total: Number(prix) || 0,
        client_id: clientId === "none" ? null : clientId,
        statut: "en_attente",
        description: null,
        date_commande: new Date().toISOString().slice(0, 10),
        date_livraison: null,
        notes: null,
      });
    },
    onSuccess: () => {
      toast.success("Commande créée");
      setTitre("");
      setPrix("");
      setType("autre");
      setClientId("none");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["commandes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ClipboardList className="h-4 w-4" />
          </span>
          Nouvelle commande rapide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <Label className="text-xs">Titre *</Label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Panneau publicitaire"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prix</Label>
              <Input
                type="number"
                step="0.01"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucun —</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={m.isPending} className="w-full" size="sm">
            <Plus className="h-4 w-4" />
            Créer la commande
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function QuickFinanceWidget() {
  const qc = useQueryClient();
  const [sens, setSens] = useState<"in" | "out">("in");
  const [source, setSource] = useState("atelier");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [catIn, setCatIn] = useState<PaiementCategorie>("vente");
  const [catOut, setCatOut] = useState<DepenseCategorie>("autre");

  const m = useMutation({
    mutationFn: async () => {
      const v = Number(montant);
      if (!v || v <= 0) throw new Error("Montant invalide");
      if (sens === "in") {
        paiementsDb.insert({
          montant: v,
          source: source as Source,
          categorie: catIn,
          methode: "especes",
          date_paiement: new Date().toISOString().slice(0, 10),
          commande_id: null,
          notes: description || null,
        });
      } else {
        depensesDb.insert({
          montant: v,
          source: source as Source,
          categorie: catOut,
          description: description.trim() || DEPENSE_CATEGORIE_LABELS[catOut],
          date_depense: new Date().toISOString().slice(0, 10),
          notes: null,
        });
      }
    },
    onSuccess: () => {
      toast.success(sens === "in" ? "Entrée enregistrée" : "Sortie enregistrée");
      setMontant("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["paiements"] });
      qc.invalidateQueries({ queryKey: ["depenses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/15 text-success">
            <Wallet className="h-4 w-4" />
          </span>
          Mouvement d'argent rapide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={sens === "in" ? "default" : "outline"}
              onClick={() => setSens("in")}
            >
              + Entrée
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sens === "out" ? "destructive" : "outline"}
              onClick={() => setSens("out")}
            >
              − Sortie
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Caisse</Label>
              <Select value={source} onValueChange={setSource}>
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
              <Label className="text-xs">Catégorie</Label>
              {sens === "in" ? (
                <Select value={catIn} onValueChange={(v) => setCatIn(v as PaiementCategorie)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAIEMENT_CATEGORIE_LABELS)
                      .filter(([k]) => !["dette_recue", "remboursement_recu"].includes(k))
                      .map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={catOut} onValueChange={(v) => setCatOut(v as DepenseCategorie)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPENSE_CATEGORIE_LABELS)
                      .filter(([k]) => !["dette_payee", "pret_accorde"].includes(k))
                      .map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Montant *</Label>
            <Input
              type="number"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div>
            <Label className="text-xs">{sens === "in" ? "Note" : "Description"}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={sens === "in" ? "Optionnel" : "Ex: facture électricité"}
            />
          </div>
          <Button
            type="submit"
            disabled={m.isPending}
            className="w-full"
            size="sm"
            variant={sens === "out" ? "destructive" : "default"}
          >
            <Plus className="h-4 w-4" />
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
