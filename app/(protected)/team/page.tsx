"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import Link from "next/link";

type TeamRow = {
  id: string;
  name: string;
  invite_code: string;
  created_at?: string;
};

type RosterRow = {
  user_id: string;
  name: string | null;
  grad_year: number | null;
  team_id: string | null;
  team_name: string | null;
};

  export default function TeamPage() {
    const { loading, profile } = useProfile();

    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [roster, setRoster] = useState<RosterRow[]>([]);
    const [err, setErr] = useState<string | null>(null);

    // create team
    const [newTeamName, setNewTeamName] = useState("");
    const [creating, setCreating] = useState(false);

    // edit team name
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    // copy feedback
    const [copiedCodeForTeamId, setCopiedCodeForTeamId] = useState<string | null>(null);

    // dropdown menu
    const [openMenuTeamId, setOpenMenuTeamId] = useState<string | null>(null);
    const [openMenuPlayerId, setOpenMenuPlayerId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const playerMenuRef = useRef<HTMLDivElement>(null);

    async function removePlayer(playerId: string) {
      if (!profile) return;

      const ok = window.confirm("Remove this player from your roster? They will be detached from teams.");
      if (!ok) return;

      setErr(null);

      const { error } = await supabase
        .from("profiles")
        .update({ coach_user_id: null, team_id: null })
        .eq("user_id", playerId)
        .eq("role", "player")
        .eq("coach_user_id", profile.user_id);

      if (error) {
        setErr(error.message);
        return;
      }

      await loadTeamsAndRoster();
    }


  async function deleteTeam(teamId: string) {
    if (!profile) return;

    const ok = window.confirm("Delete this team? Players on this team will be unassigned.");
    if (!ok) return;

    setErr(null);

    // 1) Unassign players from this team (prevents FK errors)
    const unassignRes = await supabase
      .from("profiles")
      .update({ team_id: null })
      .eq("team_id", teamId)
      .eq("coach_user_id", profile.user_id)
      .eq("role", "player");

    if (unassignRes.error) {
      setErr(unassignRes.error.message);
      return;
    }

    // 2) Delete the team
    const delRes = await supabase.from("teams").delete().eq("id", teamId);

    if (delRes.error) {
      setErr(delRes.error.message);
      return;
    }

    await loadTeamsAndRoster();
  }

  async function loadTeamsAndRoster() {
    if (!profile) return;
    setErr(null);

    // Teams
    const teamsRes = await supabase
      .from("teams")
      .select("id, name, invite_code, created_at")
      .order("created_at", { ascending: true });

    if (teamsRes.error) {
      setErr(teamsRes.error.message);
      return;
    }
    setTeams((teamsRes.data ?? []) as TeamRow[]);

    // Roster (grouping depends on this including team_id/team_name)
    const rosterRes = await supabase
      .from("my_roster")
      .select("user_id, name, grad_year, team_id, team_name")
      .order("name");

    if (rosterRes.error) {
      setErr(rosterRes.error.message);
      return;
    }
    setRoster((rosterRes.data ?? []) as RosterRow[]);
  }

  useEffect(() => {
    if (loading || !profile) return;

    if (profile.role !== "coach") {
      setErr("Only coaches have a team page.");
      return;
    }

    loadTeamsAndRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.user_id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuTeamId(null);
      }
      if (playerMenuRef.current && !playerMenuRef.current.contains(event.target as Node)) {
        setOpenMenuPlayerId(null);
      }
    }

    if (openMenuTeamId || openMenuPlayerId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuTeamId, openMenuPlayerId]);

  const rosterGrouped = useMemo(() => {
    // group roster by team_id (and keep an "Unassigned" bucket just in case)
    const map = new Map<string, { team_id: string; team_name: string; players: RosterRow[] }>();
    const unassigned: RosterRow[] = [];

    for (const p of roster) {
      if (!p.team_id) {
        unassigned.push(p);
        continue;
      }
      const key = p.team_id;
      if (!map.has(key)) {
        map.set(key, {
          team_id: key,
          team_name: p.team_name ?? "Unnamed Team",
          players: [],
        });
      }
      map.get(key)!.players.push(p);
    }

    // Ensure every team shows up even if empty
    for (const t of teams) {
      if (!map.has(t.id)) {
        map.set(t.id, { team_id: t.id, team_name: t.name, players: [] });
      }
    }

    // Return teams order first, then unassigned at end
    const ordered = teams.map((t) => map.get(t.id)!).filter(Boolean);
    return { ordered, unassigned };
  }, [roster, teams]);

  async function handleCreateTeam() {
    if (!profile) return;
    const name = newTeamName.trim();
    if (!name) {
      setErr("Team name can’t be empty.");
      return;
    }

    setCreating(true);
    setErr(null);

    const { data, error } = await supabase.rpc("create_team", { p_name: name });

    setCreating(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // RPC returns a row (or array of rows depending on supabase client behavior)
    // We'll just reload to keep things consistent.
    setNewTeamName("");
    await loadTeamsAndRoster();
  }

  function startEditTeam(t: TeamRow) {
    setEditingTeamId(t.id);
    setEditingName(t.name);
    setErr(null);
  }

  function cancelEditTeam() {
    setEditingTeamId(null);
    setEditingName("");
    setErr(null);
  }

  async function saveEditTeam(teamId: string) {
    const name = editingName.trim();
    if (!name) {
      setErr("Team name can’t be empty.");
      return;
    }

    setSavingEdit(true);
    setErr(null);

    const { error } = await supabase.from("teams").update({ name }).eq("id", teamId);

    setSavingEdit(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setEditingTeamId(null);
    setEditingName("");
    await loadTeamsAndRoster();
  }

  async function copyCode(teamId: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeForTeamId(teamId);
      setTimeout(() => setCopiedCodeForTeamId(null), 1500);
    } catch {
      setErr("Could not copy invite code.");
    }
  }

  if (loading) return null;
  if (!profile) return <main className="p-6">Please log in.</main>;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-600 mt-2">
            Create teams and share that team’s invite code so players join the right roster.
          </p>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        {profile.role === "coach" && (
          <>
            {/* Create team */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Create a Team
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="e.g., Varsity / JV / 2027s"
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={creating}
                  className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            {/* Teams list */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Your Teams
              </div>

              {teams.length === 0 ? (
                <div className="text-gray-600">
                  No teams yet. Create one above, then share its invite code.
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map((t) => (
                    <div key={t.id}>
                      {editingTeamId === t.id ? (
                        <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditTeam(t.id)}
                              disabled={savingEdit}
                              className="px-4 py-1.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEditTeam}
                              disabled={savingEdit}
                              className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{t.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              Code:{" "}
                              <span className="font-mono font-bold text-gray-900">
                                {t.invite_code}
                              </span>
                            </div>
                          </div>

                          <div className="relative" ref={openMenuTeamId === t.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenuTeamId(openMenuTeamId === t.id ? null : t.id)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                              aria-label="Team options"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                                <circle cx="8" cy="2" r="1.5"/>
                                <circle cx="8" cy="8" r="1.5"/>
                                <circle cx="8" cy="14" r="1.5"/>
                              </svg>
                            </button>

                            {openMenuTeamId === t.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    startEditTeam(t);
                                    setOpenMenuTeamId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 border-b border-gray-100"
                                >
                                  Edit Team
                                </button>
                                <button
                                  onClick={() => {
                                    copyCode(t.id, t.invite_code);
                                    setOpenMenuTeamId(null);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium border-b border-gray-100 ${
                                    copiedCodeForTeamId === t.id
                                      ? "text-green-600"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {copiedCodeForTeamId === t.id ? "✓ Copied!" : "Copy Code"}
                                </button>
                                <button
                                  onClick={() => {
                                    deleteTeam(t.id);
                                    setOpenMenuTeamId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-all text-sm font-medium text-red-600 rounded-b-lg"
                                >
                                  Delete Team
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Roster grouped by team */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
                Roster by Team
              </div>

              {teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">Create a team first.</p>
                  <p className="text-sm mt-2">
                    Players can’t register until they have a team invite code.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rosterGrouped.ordered.map((g) => (
                    <div key={g.team_id} className="space-y-2">
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="text-base font-semibold text-gray-900">{g.team_name}</div>
                        <div className="text-xs text-gray-600">
                          {g.players.length} player{g.players.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      {g.players.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2 py-2">
                          No players yet. Share this team's invite code.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {g.players.map((p) => (
                            <div
                              key={p.user_id}
                              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900">{p.name ?? "Unnamed"}</div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  Grad Year: <span className="font-medium">{p.grad_year ?? "—"}</span>
                                </div>
                              </div>

                              <div className="relative" ref={openMenuPlayerId === p.user_id ? playerMenuRef : null}>
                                <button
                                  onClick={() => setOpenMenuPlayerId(openMenuPlayerId === p.user_id ? null : p.user_id)}
                                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                                  aria-label="Player options"
                                >
                                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                                    <circle cx="8" cy="2" r="1.5"/>
                                    <circle cx="8" cy="8" r="1.5"/>
                                    <circle cx="8" cy="14" r="1.5"/>
                                  </svg>
                                </button>

                                {openMenuPlayerId === p.user_id && (
                                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <Link
                                      href={`/players/${p.user_id}/edit`}
                                      onClick={() => setOpenMenuPlayerId(null)}
                                      className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 border-b border-gray-100"
                                    >
                                      Edit Player
                                    </Link>
                                    <button
                                      onClick={() => {
                                        removePlayer(p.user_id);
                                        setOpenMenuPlayerId(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-all text-sm font-medium text-red-600 rounded-b-lg"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {rosterGrouped.unassigned.length > 0 && (
                    <div className="space-y-2 mt-6">
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="text-base font-semibold text-yellow-800">Unassigned</div>
                        <div className="text-xs text-yellow-700">
                          {rosterGrouped.unassigned.length} player{rosterGrouped.unassigned.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="text-xs text-yellow-700 px-2">
                        These players have no team assigned.
                      </div>

                      <div className="space-y-1">
                        {rosterGrouped.unassigned.map((p) => (
                          <div
                            key={p.user_id}
                            className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 hover:bg-yellow-100 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900">{p.name ?? "Unnamed"}</div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Grad Year: <span className="font-medium">{p.grad_year ?? "—"}</span>
                              </div>
                            </div>

                            <div className="relative" ref={openMenuPlayerId === p.user_id ? playerMenuRef : null}>
                              <button
                                onClick={() => setOpenMenuPlayerId(openMenuPlayerId === p.user_id ? null : p.user_id)}
                                className="p-2 hover:bg-yellow-200 rounded-lg transition-all"
                                aria-label="Player options"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                                  <circle cx="8" cy="2" r="1.5"/>
                                  <circle cx="8" cy="8" r="1.5"/>
                                  <circle cx="8" cy="14" r="1.5"/>
                                </svg>
                              </button>

                              {openMenuPlayerId === p.user_id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <Link
                                    href={`/players/${p.user_id}/edit`}
                                    onClick={() => setOpenMenuPlayerId(null)}
                                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 border-b border-gray-100"
                                  >
                                    Edit Player
                                  </Link>
                                  <button
                                    onClick={() => {
                                      removePlayer(p.user_id);
                                      setOpenMenuPlayerId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-all text-sm font-medium text-red-600 rounded-b-lg"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
