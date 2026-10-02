import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { flushSync, onSyncStatus, type SyncStatus } from "@/lib/cloud-sync";
import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  useEffect(() => onSyncStatus(setStatus), []);

  const Icon = status === "saving" ? Loader2 : status === "error" ? CloudOff : Cloud;
  const label = status === "saving" ? "Enregistrement…" : status === "error" ? "Hors ligne" : "Synchronisé";

  return (
    <div className="flex items-center gap-1">
      <span
        title={label}
        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        <Icon className={`h-4 w-4 ${status === "saving" ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{label}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Se déconnecter"
        title="Se déconnecter"
        onClick={async () => { await flushSync(); await supabase.auth.signOut(); }}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
