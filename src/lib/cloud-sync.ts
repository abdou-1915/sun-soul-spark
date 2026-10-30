// Cloud sync: localStorage stays the fast local cache, every collection is
// mirrored to the user's row in `user_store` so all devices share the data.
import { supabase } from "@/integrations/supabase/client";

export const SYNC_KEYS = [
  "clients", "commandes", "paiements", "depenses",
  "materiaux", "notes", "produits", "ventes", "vente_items", "achats_devises",
] as const;

const MIGRATED_FLAG = "cloud_migrated_user";
let currentUserId: string | null = null;
const pending = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<(s: SyncStatus) => void>();

export type SyncStatus = "idle" | "saving" | "error";
let status: SyncStatus = "idle";
function setStatus(s: SyncStatus) {
  status = s;
  listeners.forEach((l) => l(s));
}
export function onSyncStatus(fn: (s: SyncStatus) => void) {
  listeners.add(fn);
  fn(status);
  return () => { listeners.delete(fn); };
}

function readLocal(key: string): unknown[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}

async function pushKey(key: string) {
  if (!currentUserId) return;
  setStatus("saving");
  const { error } = await supabase
    .from("user_store")
    .upsert({ user_id: currentUserId, key, data: readLocal(key) as never }, { onConflict: "user_id,key" });
  if (error) { console.error("[sync]", error); setStatus("error"); return; }
  if (pending.size === 0) setStatus("idle");
}

/** Called after every local write: schedules an upload of that collection. */
export function scheduleSync(key: string) {
  if (!currentUserId) return;
  const t = pending.get(key);
  if (t) clearTimeout(t);
  pending.set(key, setTimeout(() => { pending.delete(key); void pushKey(key); }, 400));
  setStatus("saving");
}

/** Replace a whole collection locally and in the cloud. */
export function setCollection(key: string, data: unknown[]) {
  localStorage.setItem(key, JSON.stringify(data));
  scheduleSync(key);
}

/** Download every collection from the cloud into localStorage. */
export async function pullAll(): Promise<boolean> {
  if (!currentUserId) return false;
  const { data, error } = await supabase.from("user_store").select("key, data").eq("user_id", currentUserId);
  if (error) { console.error("[sync]", error); return false; }
  const rows = data ?? [];
  // Don't overwrite collections that have local changes waiting to upload.
  for (const r of rows) {
    if (pending.has(r.key)) continue;
    localStorage.setItem(r.key, JSON.stringify(r.data ?? []));
  }
  return true;
}

/** Start syncing for a signed-in user. Uploads this phone's data on first sign-in if the account is empty. */
export async function startSync(userId: string) {
  currentUserId = userId;
  const { data, error } = await supabase.from("user_store").select("key").eq("user_id", userId);
  if (error) { console.error("[sync]", error); setStatus("error"); return; }
  const cloudEmpty = (data ?? []).length === 0;
  const alreadyMigrated = localStorage.getItem(MIGRATED_FLAG) === userId;

  if (cloudEmpty && !alreadyMigrated) {
    // First time on this account: send this phone's existing data online.
    setStatus("saving");
    const rows = SYNC_KEYS.map((key) => ({ user_id: userId, key, data: readLocal(key) as never }));
    const { error: upErr } = await supabase.from("user_store").upsert(rows, { onConflict: "user_id,key" });
    if (upErr) { console.error("[sync]", upErr); setStatus("error"); return; }
    setStatus("idle");
  } else if (!alreadyMigrated) {
    // New phone on an existing account: merge this phone's data into the account (no loss).
    const local = Object.fromEntries(SYNC_KEYS.map((k) => [k, readLocal(k)]));
    await pullAll();
    for (const k of SYNC_KEYS) {
      const cloud = readLocal(k) as { id?: string }[];
      const seen = new Set(cloud.map((r) => r?.id).filter(Boolean));
      const extra = (local[k] as { id?: string }[]).filter((r) => r?.id && !seen.has(r.id));
      if (extra.length) setCollection(k, [...extra, ...cloud]);
    }
    await flushSync();
  } else {
    // Cloud is the source of truth.
    await pullAll();
  }
  localStorage.setItem(MIGRATED_FLAG, userId);
}

export function stopSync() {
  currentUserId = null;
  pending.forEach((t) => clearTimeout(t));
  pending.clear();
  for (const k of SYNC_KEYS) localStorage.removeItem(k);
}

export async function flushSync() {
  const keys = [...pending.keys()];
  keys.forEach((k) => { clearTimeout(pending.get(k)!); pending.delete(k); });
  await Promise.all(keys.map(pushKey));
}
