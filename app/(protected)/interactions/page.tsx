"use client";

import { useEffect, useState, useRef } from "react";
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

  // dropdown menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // filters
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterGradYear, setFilterGradYear] = useState<string>("all");

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

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

  // Get unique teams and grad years for filters
  const uniqueTeams = Array.from(new Set(rows.map(r => r.teamName).filter(Boolean))) as string[];
  const uniqueGradYears = Array.from(new Set(rows.map(r => r.gradYear).filter(Boolean))).sort((a, b) => (a as number) - (b as number)) as number[];

  // Apply filters
  const filteredRows = rows.filter(r => {
    if (filterTeam !== "all" && r.teamName !== filterTeam) return false;
    if (filterGradYear !== "all" && String(r.gradYear) !== filterGradYear) return false;
    return true;
  });

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


        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {isCoach && rows.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Filters</div>

              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              >
                <option value="all">All Teams</option>
                {uniqueTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <select
                value={filterGradYear}
                onChange={(e) => setFilterGradYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              >
                <option value="all">All Grad Years</option>
                {uniqueGradYears.map((year) => (
                  <option key={year} value={String(year)}>
                    Class of {year}
                  </option>
                ))}
              </select>

              {(filterTeam !== "all" || filterGradYear !== "all") && (
                <button
                  onClick={() => {
                    setFilterTeam("all");
                    setFilterGradYear("all");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium underline"
                >
                  Clear Filters
                </button>
              )}

              <div className="text-sm text-gray-600 ml-auto font-medium">
                Showing {filteredRows.length} of {rows.length}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          {rows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg font-medium mb-3">No interactions yet.</p>
              <p className="text-gray-500 text-sm">Click "Log Interaction" to get started.</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg font-medium mb-3">No interactions match your filters.</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or clearing them.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRows.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 transition-all flex items-center justify-between gap-4"
                >
                  <Link
                    href={isCoach ? `/players/${r.subject_user_id}/interactions` : `/interactions`}
                    className="flex-1 min-w-0 grid grid-cols-4 gap-4 p-3 hover:bg-gray-100 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">Player</div>
                      <div className="font-semibold text-gray-900 truncate">
                        {isCoach ? (r.playerName ?? "Unknown") : "You"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">College</div>
                      <div className="font-medium text-gray-900 truncate">
                        {r.college_name ?? "—"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">Team</div>
                      <div className="font-medium text-gray-900 truncate">
                        {isCoach ? (r.teamName ?? "—") : "—"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">Date</div>
                      <div className="font-medium text-gray-900">
                        {new Date(r.occurred_on).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>

                  <div className="relative p-3" ref={openMenuId === r.id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                      aria-label="Interaction options"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                        <circle cx="8" cy="2" r="1.5"/>
                        <circle cx="8" cy="8" r="1.5"/>
                        <circle cx="8" cy="14" r="1.5"/>
                      </svg>
                    </button>

                    {openMenuId === r.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <Link
                          href={`/interactions/${r.id}/edit`}
                          onClick={() => setOpenMenuId(null)}
                          className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 border-b border-gray-100"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            deleteInteraction(r.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-all text-sm font-medium text-red-600 rounded-b-lg"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
