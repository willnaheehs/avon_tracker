"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type Row = {
  id: string;
  type: string | null;
  occurred_on: string;
  notes: string | null;
  subject_user_id: string;
  playerName?: string | null;
};

type RosterRow = { user_id: string; name: string | null };

export default function InteractionsPage() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile) return;

      setError(null);
      setRows([]);

      if (profile.role === "player") {
        // Player: only my interactions
        const { data, error } = await supabase
          .from("interactions")
          .select("id, type, occurred_on, notes, subject_user_id")
          .eq("subject_user_id", profile.user_id)
          .order("occurred_on", { ascending: false });

        if (error) {
          setError(error.message);
          return;
        }

        setRows((data ?? []) as Row[]);
        return;
      }

      if (profile.role === "coach") {
        // Coach: load roster (scoped by auth.uid() via view)
        const rosterRes = await supabase
          .from("my_roster")
          .select("user_id, name")
          .order("name");

        if (rosterRes.error) {
          setError(rosterRes.error.message);
          return;
        }

        const roster = (rosterRes.data ?? []) as RosterRow[];
        const rosterIds = roster.map((p) => p.user_id);

        const rosterMap: Record<string, string | null> = {};
        roster.forEach((p) => {
          rosterMap[p.user_id] = p.name;
        });

        if (rosterIds.length === 0) {
          setRows([]);
          return;
        }

        // Only fetch interactions for roster players
        const { data, error } = await supabase
          .from("interactions")
          .select("id, type, occurred_on, notes, subject_user_id")
          .in("subject_user_id", rosterIds)
          .order("occurred_on", { ascending: false });

        if (error) {
          setError(error.message);
          return;
        }

        setRows(
          (data ?? []).map((d: any) => ({
            id: d.id,
            type: d.type,
            occurred_on: d.occurred_on,
            notes: d.notes,
            subject_user_id: d.subject_user_id,
            playerName: rosterMap[d.subject_user_id] ?? null,
          }))
        );
      }
    }

    if (!loading) load();
  }, [loading, profile]);

  if (loading) return null;

  if (!profile) {
    return (
      <main className="p-6">
        You must be signed in to view interactions.
      </main>
    );
  }

  const isCoach = profile.role === "coach";

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isCoach ? "All Interactions" : "My Interactions"}
        </h1>

        <Link href="/interactions/new" className="px-3 py-2 border rounded">
          Log Interaction
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <div className="font-medium">
              {r.type ?? "(unknown)"}{" "}
              <span className="ml-1 opacity-70">
                {new Date(r.occurred_on).toLocaleDateString()}
              </span>
            </div>

            {isCoach && (
              <div className="text-sm opacity-80">
                {r.playerName ?? r.subject_user_id}
              </div>
            )}

            {r.notes && <div className="mt-1 text-sm opacity-80">{r.notes}</div>}
          </li>
        ))}

        {rows.length === 0 && (
          <p className="opacity-70">No interactions yet.</p>
        )}
      </ul>
    </main>
  );
}
