import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Download, Loader2, Trash2 } from "lucide-react";

interface PollRow {
  id?: string;
  index_number: number | null;
  country: string;
  category: string;
  question_type: string;
  title: string;
  options: string;
  resolution_criteria: string;
  close_at: string;
  context: string;
  expert_insight: string;
  status: string;
  isNew?: boolean;
  isDirty?: boolean;
}

const PollManager = ({ adminKey }: { adminKey: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedRows, setEditedRows] = useState<Record<string, PollRow>>({});
  const [newRows, setNewRows] = useState<PollRow[]>([]);
  const [saving, setSaving] = useState(false);

  const invokeAdminPolls = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-polls", {
      body: { admin_key: adminKey.trim(), ...payload },
    });

    if (error) {
      const context = (error as any)?.context;
      if (context && typeof context.json === "function") {
        const parsed = await context.json().catch(() => null);
        if (parsed?.message || parsed?.error) {
          throw new Error(parsed.message || parsed.error);
        }
      }
      throw error;
    }

    if ((data as any)?.error) {
      throw new Error((data as any).message || (data as any).error);
    }

    return data;
  };

  const { data: polls, isLoading } = useQuery({
    queryKey: ["admin-poll-manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options!poll_options_poll_id_fkey(label)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data?.map((p: any) => ({
        id: p.id,
        index_number: p.index_number,
        country: p.country || "",
        category: p.category,
        question_type: p.question_type || "yes_no",
        title: p.title,
        options: p.poll_options?.map((o: any) => o.label).join(", ") || "",
        resolution_criteria: p.resolution_criteria || "",
        close_at: p.close_at?.split("T")[0] || "",
        context: p.context || "",
        expert_insight: p.expert_insight || "",
        status: p.status,
      })) || [];
    },
  });

  const getRow = (poll: PollRow): PollRow => {
    if (poll.id && editedRows[poll.id]) return editedRows[poll.id];
    return poll;
  };

  const updateField = (pollId: string, field: keyof PollRow, value: string | number | null) => {
    const original = polls?.find(p => p.id === pollId);
    if (!original) return;
    setEditedRows(prev => ({
      ...prev,
      [pollId]: { ...(prev[pollId] || original), [field]: value, isDirty: true },
    }));
  };

  const updateNewRow = (idx: number, field: keyof PollRow, value: string | number | null) => {
    setNewRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addNewRow = () => {
    setNewRows(prev => [...prev, {
      index_number: (polls?.length || 0) + prev.length + 1,
      country: "Kenya",
      category: "Monetary Policy & Macro",
      question_type: "yes_no",
      title: "",
      options: "Yes, No",
      resolution_criteria: "",
      close_at: "2026-12-31",
      context: "",
      expert_insight: "",
      status: "active",
      isNew: true,
    }]);
  };

  const removeNewRow = (idx: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [pollId, row] of Object.entries(editedRows)) {
        if (!row.isDirty) continue;
        await invokeAdminPolls({
          action: "update_poll",
          poll_id: pollId,
          updates: {
            title: row.title,
            category: row.category,
            context: row.context || null,
            resolution_criteria: row.resolution_criteria || null,
            expert_insight: row.expert_insight || null,
            close_at: new Date(row.close_at).toISOString(),
            country: row.country || null,
            question_type: row.question_type,
            index_number: row.index_number,
          },
        });
      }

      for (const row of newRows) {
        if (!row.title.trim()) continue;
        const slug = `q${row.index_number}-${row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`;
        const options = row.options.split(",").map(o => o.trim()).filter(Boolean);
        await invokeAdminPolls({
          action: "create_poll",
          poll: {
            title: row.title,
            slug,
            category: row.category,
            context: row.context || null,
            close_at: new Date(row.close_at).toISOString(),
            status: "active",
            country: row.country || null,
            question_type: row.question_type,
            index_number: row.index_number,
            resolution_criteria: row.resolution_criteria || null,
            expert_insight: row.expert_insight || null,
          },
          options,
        });
      }

      setEditedRows({});
      setNewRows([]);
      queryClient.invalidateQueries({ queryKey: ["admin-poll-manager"] });
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      toast({ title: "✅ Saved", description: "All poll changes saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!polls?.length) return;
    const headers = ["Index", "Country", "Category", "Type", "Question", "Options", "Resolution Criteria", "Resolution Date", "Context", "Expert Insight", "Status"];
    const csv = [
      headers.join(","),
      ...polls.map(p => [
        p.index_number, p.country, p.category, p.question_type, `"${p.title}"`,
        `"${p.options}"`, `"${p.resolution_criteria}"`, p.close_at, `"${p.context}"`,
        `"${p.expert_insight}"`, p.status,
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polls_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLS = [
    { key: "index_number", label: "#", w: "w-12" },
    { key: "country", label: "Country", w: "w-24" },
    { key: "category", label: "Category", w: "w-36" },
    { key: "question_type", label: "Type", w: "w-20" },
    { key: "title", label: "Question", w: "min-w-[200px]" },
    { key: "options", label: "Options", w: "w-32" },
    { key: "resolution_criteria", label: "Resolution Criteria", w: "w-40" },
    { key: "close_at", label: "Resolution Date", w: "w-28" },
    { key: "context", label: "Context", w: "w-40" },
    { key: "expert_insight", label: "Expert Insight", w: "w-40" },
    { key: "status", label: "Status", w: "w-20" },
  ] as const;

  const renderCell = (row: PollRow, field: string, onChange: (field: keyof PollRow, val: string | number | null) => void) => {
    const value = (row as any)[field] ?? "";
    if (field === "status") {
      return (
        <select value={value} onChange={e => onChange("status", e.target.value)}
          className="w-full text-[11px] border border-border rounded px-1 py-0.5 bg-background text-foreground">
          <option value="active">active</option>
          <option value="closed">closed</option>
          <option value="settled">settled</option>
        </select>
      );
    }
    if (field === "question_type") {
      return (
        <select value={value} onChange={e => onChange("question_type", e.target.value)}
          className="w-full text-[11px] border border-border rounded px-1 py-0.5 bg-background text-foreground">
          <option value="yes_no">Yes/No</option>
          <option value="multiple_choice">Multi</option>
          <option value="range">Range</option>
        </select>
      );
    }
    if (field === "close_at") {
      return <input type="date" value={value} onChange={e => onChange("close_at", e.target.value)}
        className="w-full text-[11px] border border-border rounded px-1 py-0.5 bg-background text-foreground" />;
    }
    if (field === "index_number") {
      return <input type="number" value={value} onChange={e => onChange("index_number", e.target.value ? Number(e.target.value) : null)}
        className="w-full text-[11px] border border-border rounded px-1 py-0.5 bg-background text-foreground text-center" />;
    }
    return <input type="text" value={value} onChange={e => onChange(field as keyof PollRow, e.target.value)}
      className="w-full text-[11px] border border-border rounded px-1 py-0.5 bg-background text-foreground" />;
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading polls...</div>;
  }

  const dirtyCount = Object.values(editedRows).filter(r => r.isDirty).length + newRows.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">
          Poll Management ({polls?.length || 0} questions)
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={addNewRow}>
            <Plus className="w-4 h-4 mr-1" /> Add Question
          </Button>
          <Button size="sm" onClick={saveAll} disabled={saving || dirtyCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save ({dirtyCount})
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {COLS.map(col => (
                <th key={col.key} className={`text-left px-2 py-2 font-medium text-muted-foreground ${col.w}`}>
                  {col.label}
                </th>
              ))}
              <th className="w-8 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {polls?.map((poll) => {
              const row = getRow(poll);
              const isDirty = editedRows[poll.id!]?.isDirty;
              return (
                <tr key={poll.id} className={`border-t border-border/50 ${isDirty ? "bg-amber-50/50" : ""}`}>
                  {COLS.map(col => (
                    <td key={col.key} className={`px-1 py-1 ${col.w}`}>
                      {renderCell(row, col.key, (field, val) => updateField(poll.id!, field, val))}
                    </td>
                  ))}
                  <td className="px-1 py-1"></td>
                </tr>
              );
            })}
            {newRows.map((row, idx) => (
              <tr key={`new-${idx}`} className="border-t border-border/50 bg-green-50/50">
                {COLS.map(col => (
                  <td key={col.key} className={`px-1 py-1 ${col.w}`}>
                    {renderCell(row, col.key, (field, val) => updateNewRow(idx, field, val))}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button onClick={() => removeNewRow(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Edit cells inline. Click "Save" to persist changes. New questions appear as green rows. 
        Settlement is handled via the "Polls & Settlement" tab — set the winning option there to trigger payouts.
      </p>
    </div>
  );
};

export default PollManager;
