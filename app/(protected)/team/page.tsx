"use client";

import { useEffect, useMemo, useState } from "react";
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
                <div className="space-y-4">
                  {teams.map((t) => (
                    <div key={t.id} className="border-2 border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {editingTeamId === t.id ? (
                            <div className="space-y-3">
                              <input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                              />
                              <div className="flex gap-3">
                                <button
                                  onClick={() => saveEditTeam(t.id)}
                                  disabled={savingEdit}
                                  className="px-5 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
                                >
                                  {savingEdit ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={cancelEditTeam}
                                  disabled={savingEdit}
                                  className="px-5 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-xl font-semibold text-gray-900">{t.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Invite Code:{" "}
                                <span className="font-mono font-bold text-gray-900">
                                  {t.invite_code}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {editingTeamId !== t.id && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => startEditTeam(t)}
                              className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => copyCode(t.id, t.invite_code)}
                              className={`px-4 py-2 font-medium rounded-lg transition-all shadow-md ${
                                copiedCodeForTeamId === t.id
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              }`}
                            >
                              {copiedCodeForTeamId === t.id ? "✓ Copied!" : "Copy Code"}
                            </button>
                            <button
                                onClick={() => deleteTeam(t.id)}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all shadow-md"
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
                    <div key={g.team_id} className="border-2 border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">{g.team_name}</div>
                        <div className="text-sm text-gray-600">
                          {g.players.length} player{g.players.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      {g.players.length === 0 ? (
                        <div className="text-sm text-gray-500 mt-3">
                          No players yet. Share this team’s invite code.
                        </div>
                      ) : (
                        <div className="space-y-3 mt-4">
                          {g.players.map((p) => (
                            <div
                              key={p.user_id}
                              className="border-2 border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all flex items-start justify-between gap-4"
                            >
                              <div>
                                <div className="font-semibold text-lg text-gray-900">{p.name ?? "Unnamed"}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Graduation Year: <span className="font-medium">{p.grad_year ?? "—"}</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Link
                                  href={`/players/${p.user_id}/edit`}
                                  className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md text-center"
                                >
                                  Edit
                                </Link>

                                <button
                                  onClick={() => removePlayer(p.user_id)}
                                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all shadow-md"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {rosterGrouped.unassigned.length > 0 && (
                    <div className="border-2 border-yellow-100 bg-yellow-50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-gray-900">Unassigned</div>
                      <div className="text-sm text-gray-700 mt-1">
                        These players have no team_id (shouldn’t happen once you enforce it).
                      </div>

                      <div className="space-y-3 mt-4">
                        {rosterGrouped.unassigned.map((p) => (
                          <div
                            key={p.user_id}
                            className="border-2 border-yellow-100 rounded-lg p-4 bg-white"
                          >
                            <div className="font-semibold text-lg text-gray-900">
                              {p.name ?? "Unnamed"}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Graduation Year:{" "}
                              <span className="font-medium">{p.grad_year ?? "—"}</span>
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
