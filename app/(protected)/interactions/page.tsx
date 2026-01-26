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
  gradYear?: number | null;
  teamName?: string | null;
  college_name?: string | null;
};

type RosterRow = {
  user_id: string;
  name: string | null;
  grad_year: number | null;
  coach_user_id: string | null;
};


export default function InteractionsPage() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function deleteInteraction(id: string) {
    if (!window.confirm("Delete this log? This cannot be undone.")) return;

    setError(null);

    const { error } = await supabase.from("interactions").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    // remove from UI immediately
    setRows((prev) => prev.filter((x) => x.id !== id));
  }

  useEffect(() => {
    async function load() {
      if (!profile) return;

      setError(null);
      setRows([]);

      if (profile.role === "player") {
        // Player: only my interactions
        const { data, error } = await supabase
          .from("interactions")
          .select("id, type, occurred_on, notes, subject_user_id, college_name")
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
          .from("profiles")
          .select("user_id, name, grad_year, coach_user_id")
          .eq("role", "player")
          .eq("coach_user_id", profile.user_id)
          .order("name");

        if (rosterRes.error) {
          setError(rosterRes.error.message);
          return;
        }

        const roster = (rosterRes.data ?? []) as RosterRow[];
        const rosterIds = roster.map((p) => p.user_id);

        const rosterMap: Record<string, { name: string | null; gradYear: number | null }> = {};
        roster.forEach((p) => {
          rosterMap[p.user_id] = { name: p.name, gradYear: p.grad_year };
        });

        // Fetch coach's team name
        const coachRes = await supabase
          .from("coaches")
          .select("team_name")
          .eq("user_id", profile.user_id)
          .maybeSingle();

        const teamName = coachRes.data?.team_name ?? null;

        if (rosterIds.length === 0) {
          setRows([]);
          return;
        }

        // Only fetch interactions for roster players
        const { data, error } = await supabase
          .from("interactions")
          .select("id, type, occurred_on, notes, subject_user_id, college_name")
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
            playerName: rosterMap[d.subject_user_id]?.name ?? null,
            gradYear: rosterMap[d.subject_user_id]?.gradYear ?? null,
            teamName: teamName,
            college_name: d.college_name,
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
    <main className="min-h-screen bg-gradient-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {isCoach ? "All Interactions" : "My Interactions"}
            </h1>

            <Link
              href="/interactions/new"
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
            >
              Log Interaction
            </Link>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rows.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-black text-white px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-xl truncate">{r.type ?? "(unknown)"}</div>
                    <span className="text-sm font-medium">
                      {new Date(r.occurred_on).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/interactions/${r.id}/edit`}
                      className="px-3 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => deleteInteraction(r.id)}
                      className="px-3 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>


              <div className="p-6 space-y-4">
                {isCoach && (
                  <div className="space-y-2">
                    <div className="font-bold text-lg text-gray-900">{r.playerName ?? r.subject_user_id}</div>
                    <div className="flex items-center gap-3">
                      {r.gradYear && (
                        <span className="border-2 border-gray-300 px-4 py-1 rounded-full text-sm font-medium bg-gray-50">
                          Class of {r.gradYear}
                        </span>
                      )}
                      {r.teamName && (
                        <span className="border-2 border-gray-300 px-4 py-1 rounded-full text-sm font-medium bg-[#9DCFF5]">
                          {r.teamName}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {r.college_name && (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-purple-50">
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">College/University</div>
                    <div className="font-bold text-lg text-purple-900">{r.college_name}</div>
                  </div>
                )}

                {r.notes && (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Notes</div>
                    <div className="text-gray-800">{r.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-700 text-lg font-medium mb-3">No interactions yet.</p>
              <p className="text-gray-500 text-sm">Click "Log Interaction" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
