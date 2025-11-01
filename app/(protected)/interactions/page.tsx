// app/(protected)/interactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type BaseRow = {
  id: string;
  type: string;
  occurred_at: string;
  summary: string | null;
  notes: string | null;
};

// For coaches, `player` is embedded as a SINGLE object via FK-qualified embed.
type Row = BaseRow & {
  player?: { first_name: string; last_name: string } | null;
};

export default function InteractionsPage() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    async function loadForCoach() {
      const { data, error } = await supabase
        .from("interactions")
        .select(`
          id, type, occurred_at, summary, notes,
          player:players!interactions_player_id_fkey ( first_name, last_name )
        `)
        .order("occurred_at", { ascending: false });

      if (error) {
        setErr(error.message);
      } else {
        // Supabase embeds the FK as an array even for single FK relationships;
        // normalize to a single object or null so it matches our Row type.
        const normalized = (data ?? []).map((d: any) => ({
          id: d.id,
          type: d.type,
          occurred_at: d.occurred_at,
          summary: d.summary,
          notes: d.notes,
          player: Array.isArray(d.player) ? (d.player[0] ?? null) : (d.player ?? null),
        })) as Row[];

        setRows(normalized);
      }
    }

    async function loadForPlayer() {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, type, occurred_at, summary, notes")
        .order("occurred_at", { ascending: false });

      if (error) setErr(error.message);
      else setRows((data ?? []) as Row[]);
    }

    if (profile?.role === "coach") loadForCoach();
    else loadForPlayer();
  }, [loading, profile?.role]);

  if (loading) return null;

  const isCoach = profile?.role === "coach";

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isCoach ? "All Interactions" : "My Interactions"}
        </h1>
        {!isCoach && (
          <Link href="/interactions/new" className="px-3 py-2 border rounded">
            Log Interaction
          </Link>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <div className="font-medium">
              {r.type} • {new Date(r.occurred_at).toLocaleString()}
            </div>

            {isCoach && r.player && (
              <div className="text-sm opacity-80">
                {r.player.last_name}, {r.player.first_name}
              </div>
            )}

            {r.summary && <div className="mt-1">{r.summary}</div>}
            {r.notes && (
              <div className="mt-1 text-sm opacity-80">{r.notes}</div>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <p className="opacity-70">No interactions yet.</p>
        )}
      </ul>
    </main>
  );
}
