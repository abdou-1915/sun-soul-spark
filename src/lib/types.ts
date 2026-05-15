export type Client = {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  created_at: string;
};

export type CommandeStatut = "en_attente" | "en_cours" | "termine" | "livre" | "annule";
export type CommandeType = "cnc" | "laser" | "decoration" | "publicite" | "autre";

export type Commande = {
  id: string;
  client_id: string | null;
  titre: string;
  description: string | null;
  type: CommandeType;
  statut: CommandeStatut;
  prix_total: number;
  date_commande: string;
  date_livraison: string | null;
  notes: string | null;
  created_at: string;
};

export type Paiement = {
  id: string;
  commande_id: string | null;
  montant: number;
  methode: "especes" | "virement" | "cheque" | "carte";
  date_paiement: string;
  notes: string | null;
  source: Source;
};

export type Source = "atelier" | "boutique";

export const SOURCE_LABELS: Record<Source, string> = {
  atelier: "Atelier",
  boutique: "Boutique",
};

export type Depense = {
  id: string;
  description: string;
  categorie: "materiaux" | "electricite" | "loyer" | "salaire" | "transport" | "autre";
  montant: number;
  date_depense: string;
  notes: string | null;
  source: Source;
};

export type Materiau = {
  id: string;
  nom: string;
  unite: string;
  quantite: number;
  seuil_alerte: number;
  prix_unitaire: number;
  fournisseur: string | null;
  notes: string | null;
};

export type Note = {
  id: string;
  titre: string;
  contenu: string | null;
  couleur: string;
  created_at: string;
};

export const STATUT_LABELS: Record<CommandeStatut, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  termine: "Terminé",
  livre: "Livré",
  annule: "Annulé",
};

export const TYPE_LABELS: Record<CommandeType, string> = {
  cnc: "CNC",
  laser: "Laser",
  decoration: "Décoration",
  publicite: "Publicité",
  autre: "Autre",
};

export type Produit = {
  id: string;
  nom: string;
  categorie: "telephone" | "accessoire" | "ecouteur" | "chargeur" | "coque" | "autre";
  marque: string | null;
  code_barre: string | null;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  seuil_alerte: number;
  notes: string | null;
};

export type Vente = {
  id: string;
  client_id: string | null;
  date_vente: string;
  total: number;
  methode_paiement: "especes" | "carte" | "virement" | "cheque";
  notes: string | null;
  created_at: string;
};

export type VenteItem = {
  id: string;
  vente_id: string;
  produit_id: string | null;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
};

export const CATEGORIE_LABELS: Record<Produit["categorie"], string> = {
  telephone: "Téléphone",
  accessoire: "Accessoire",
  ecouteur: "Écouteur",
  chargeur: "Chargeur",
  coque: "Coque",
  autre: "Autre",
};

export const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(n);

export const formatDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
