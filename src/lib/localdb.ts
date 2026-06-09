// ============================================================
// localdb.ts — replaces Supabase with localStorage
// ============================================================
import type {
  Client,
  Commande,
  Paiement,
  Depense,
  Materiau,
  Note,
  Produit,
  Vente,
  VenteItem,
} from "./types";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

function now() {
  return new Date().toISOString();
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── CLIENTS ──────────────────────────────────────────────────
export const clientsDb = {
  list(): Client[] {
    return load<Client>("clients").sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  insert(form: Omit<Client, "id" | "created_at">) {
    const rows = load<Client>("clients");
    const item: Client = { ...form, id: uid(), created_at: now() };
    save("clients", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Client>) {
    const rows = load<Client>("clients").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("clients", rows);
  },
  delete(id: string) {
    save(
      "clients",
      load<Client>("clients").filter((r) => r.id !== id),
    );
  },
  count(): number {
    return load<Client>("clients").length;
  },
};

// ── COMMANDES ────────────────────────────────────────────────
export const commandesDb = {
  list(): Commande[] {
    return load<Commande>("commandes").sort((a, b) =>
      b.date_commande.localeCompare(a.date_commande),
    );
  },
  insert(form: Omit<Commande, "id" | "created_at">) {
    const rows = load<Commande>("commandes");
    const item: Commande = { ...form, id: uid(), created_at: now() };
    save("commandes", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Commande>) {
    const rows = load<Commande>("commandes").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("commandes", rows);
  },
  delete(id: string) {
    save(
      "commandes",
      load<Commande>("commandes").filter((r) => r.id !== id),
    );
  },
};

// ── PAIEMENTS ────────────────────────────────────────────────
export const paiementsDb = {
  list(): Paiement[] {
    return load<Paiement>("paiements").sort((a, b) =>
      b.date_paiement.localeCompare(a.date_paiement),
    );
  },
  insert(form: Omit<Paiement, "id">) {
    const rows = load<Paiement>("paiements");
    const item: Paiement = { ...form, id: uid() };
    save("paiements", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Paiement>) {
    const rows = load<Paiement>("paiements").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("paiements", rows);
  },
  delete(id: string) {
    save(
      "paiements",
      load<Paiement>("paiements").filter((r) => r.id !== id),
    );
  },
};

// ── DEPENSES ─────────────────────────────────────────────────
export const depensesDb = {
  list(): Depense[] {
    return load<Depense>("depenses").sort((a, b) => b.date_depense.localeCompare(a.date_depense));
  },
  insert(form: Omit<Depense, "id">) {
    const rows = load<Depense>("depenses");
    const item: Depense = { ...form, id: uid() };
    save("depenses", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Depense>) {
    const rows = load<Depense>("depenses").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("depenses", rows);
  },
  delete(id: string) {
    save(
      "depenses",
      load<Depense>("depenses").filter((r) => r.id !== id),
    );
  },
};

// ── MATERIAUX ────────────────────────────────────────────────
export const materiauxDb = {
  list(): Materiau[] {
    return load<Materiau>("materiaux").sort((a, b) => a.nom.localeCompare(b.nom));
  },
  insert(form: Omit<Materiau, "id">) {
    const rows = load<Materiau>("materiaux");
    const item: Materiau = { ...form, id: uid() };
    save("materiaux", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Materiau>) {
    const rows = load<Materiau>("materiaux").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("materiaux", rows);
  },
  delete(id: string) {
    save(
      "materiaux",
      load<Materiau>("materiaux").filter((r) => r.id !== id),
    );
  },
};

// ── NOTES ────────────────────────────────────────────────────
export const notesDb = {
  list(): Note[] {
    return load<Note>("notes").sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  insert(form: Omit<Note, "id" | "created_at">) {
    const rows = load<Note>("notes");
    const item: Note = { ...form, id: uid(), created_at: now() };
    save("notes", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Note>) {
    const rows = load<Note>("notes").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("notes", rows);
  },
  delete(id: string) {
    save(
      "notes",
      load<Note>("notes").filter((r) => r.id !== id),
    );
  },
};

// ── PRODUITS ─────────────────────────────────────────────────
export const produitsDb = {
  list(): Produit[] {
    return load<Produit>("produits").sort((a, b) => a.nom.localeCompare(b.nom));
  },
  insert(form: Omit<Produit, "id">) {
    const rows = load<Produit>("produits");
    const item: Produit = { ...form, id: uid() };
    save("produits", [item, ...rows]);
    return item;
  },
  update(id: string, form: Partial<Produit>) {
    const rows = load<Produit>("produits").map((r) => (r.id === id ? { ...r, ...form } : r));
    save("produits", rows);
  },
  delete(id: string) {
    save(
      "produits",
      load<Produit>("produits").filter((r) => r.id !== id),
    );
  },
};

// ── VENTES ───────────────────────────────────────────────────
export const ventesDb = {
  list(): Vente[] {
    return load<Vente>("ventes").sort((a, b) => b.date_vente.localeCompare(a.date_vente));
  },
  insert(form: Omit<Vente, "id" | "created_at">) {
    const rows = load<Vente>("ventes");
    const item: Vente = { ...form, id: uid(), created_at: now() };
    save("ventes", [item, ...rows]);
    return item;
  },
  delete(id: string) {
    save(
      "ventes",
      load<Vente>("ventes").filter((r) => r.id !== id),
    );
  },
};

// ── VENTE ITEMS ──────────────────────────────────────────────
export const venteItemsDb = {
  listByVente(venteId: string): VenteItem[] {
    return load<VenteItem>("vente_items").filter((r) => r.vente_id === venteId);
  },
  insert(form: Omit<VenteItem, "id">) {
    const rows = load<VenteItem>("vente_items");
    const item: VenteItem = { ...form, id: uid() };
    save("vente_items", [item, ...rows]);
    return item;
  },
  deleteByVente(venteId: string) {
    save(
      "vente_items",
      load<VenteItem>("vente_items").filter((r) => r.vente_id !== venteId),
    );
  },
};
