import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Shield, AlertTriangle, CheckCircle, History } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";

type Mode = "live" | "demo";

interface AuditRow {
  id: string;
  changed_at: string;
  previous_mode: string;
  new_mode: string;
  actor_email: string | null;
}

const COPY: Record<Mode, {
  badge: string;
  badgeClass: string;
  title: string;
  description: string;
  confirmPhrase: string;
  confirmHeader: string;
  confirmBody: string;
}> = {
  live: {
    badge: "LIVE",
    badgeClass: "bg-green-500/15 text-green-700 border-green-500/30",
    title: "Switch to Live Mode",
    description: "Real funds will flow on every Pro action.",
    confirmPhrase: "SWITCH",
    confirmHeader: "Switch to Live mode?",
    confirmBody:
      "Switching to Live mode will route every Pro action — stakes, listings, settlements, payouts — through real wallets and Paystack. Real funds will be at stake immediately. Type SWITCH to confirm.",
  },
  demo: {
    badge: "DEMO",
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    title: "Switch to Demo Mode",
    description: "All Pro actions will route to virtual Arena Coins.",
    confirmPhrase: "PAUSE",
    confirmHeader: "Switch to Demo mode?",
    confirmBody:
      "Switching to Demo mode will block all real-money operations and route Pro to virtual Arena Coins, possibly mid-session for users with active stakes. Type PAUSE to confirm.",
  },
};

export default function PlatformModeTab() {
  const { proMode, refreshProMode } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  const auditQuery = useQuery({
    queryKey: ["platform_config_audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_config_audit" as any)
        .select("id, changed_at, previous_mode, new_mode, actor_email")
        .order("changed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as AuditRow[];
    },
  });

  // Realtime: refresh audit list when any admin (including this one) toggles.
  useEffect(() => {
    const ch = supabase
      .channel("platform_config_audit_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "platform_config_audit" },
        () => queryClient.invalidateQueries({ queryKey: ["platform_config_audit"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  const mutation = useMutation({
    mutationFn: async (mode: Mode) => {
      const { data, error } = await supabase.functions.invoke("set-platform-mode", {
        body: { mode },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: async (_d, mode) => {
      toast({
        title: `✅ Platform mode set to ${mode.toUpperCase()}`,
        description: mode === "live"
          ? "Real funds now flow on Pro actions."
          : "Pro actions are now in virtual Arena Coins.",
      });
      await refreshProMode();
      queryClient.invalidateQueries({ queryKey: ["platform_config_audit"] });
      setPendingMode(null);
      setConfirmInput("");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update platform mode",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const currentMode: Mode = proMode === "live" ? "live" : "demo";
  const currentCopy = COPY[currentMode];
  const targetMode: Mode = currentMode === "live" ? "demo" : "live";
  const targetCopy = COPY[targetMode];
  const expectedPhrase = targetCopy.confirmPhrase;
  const phraseMatches = confirmInput.trim() === expectedPhrase;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Platform Mode
        </h2>
        <p className="text-sm text-muted-foreground">
          Controls whether all Pro actions are settled in real funds or virtual Arena Coins. This is the most-sensitive admin action on the platform.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Current mode</p>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-bold rounded-md border ${currentCopy.badgeClass}`}>
                {currentCopy.badge}
              </span>
              {proMode === "loading" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {currentMode === "live"
                ? "Pro Edge Functions are routing through real wallets, real Paystack transfers, and real settlements."
                : "Pro Edge Functions are routing through demo wallets. No real money is moving."}
            </p>
          </div>

          <Button
            variant={targetMode === "live" ? "default" : "destructive"}
            disabled={proMode === "loading" || mutation.isPending}
            onClick={() => { setPendingMode(targetMode); setConfirmInput(""); }}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
            {targetCopy.title}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <History className="w-4 h-4" /> Recent mode changes
        </h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {auditQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
          ) : (auditQuery.data?.length ?? 0) === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No mode changes recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">When (UTC)</th>
                  <th className="text-left px-4 py-2">From</th>
                  <th className="text-left px-4 py-2">To</th>
                  <th className="text-left px-4 py-2">Actor</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.data!.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">
                      {new Date(row.changed_at).toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="px-4 py-2 uppercase text-xs">{row.previous_mode}</td>
                    <td className="px-4 py-2 uppercase text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" /> {row.new_mode}
                    </td>
                    <td className="px-4 py-2 text-xs">{row.actor_email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertDialog open={pendingMode !== null} onOpenChange={(open) => { if (!open) { setPendingMode(null); setConfirmInput(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {pendingMode ? COPY[pendingMode].confirmHeader : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode ? COPY[pendingMode].confirmBody : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-xs text-muted-foreground block mb-1">
              Type <span className="font-mono font-bold text-foreground">{pendingMode ? COPY[pendingMode].confirmPhrase : ""}</span> to confirm
            </label>
            <Input
              autoFocus
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={pendingMode ? COPY[pendingMode].confirmPhrase : ""}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!phraseMatches || mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingMode && phraseMatches) mutation.mutate(pendingMode);
              }}
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
