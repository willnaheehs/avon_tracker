"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function TeamPage() {
  const { loading, profile } = useProfile();
  const [code, setCode] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading || !profile) return;

    async function load() {
      setErr(null);

      if (profile.role !== "coach") {
        setErr("Only coaches have a team page.");
        return;
      }

      const coachRes = await supabase
        .from("coaches")
        .select("team_name, code")
        .single();

      if (coachRes.error) {
        setErr(coachRes.error.message);
        return;
      }

      setTeam(coachRes.data.team_name ?? null);
      setCode(coachRes.data.code ?? null);

      const rosterRes = await supabase
        .from("my_roster")
        .select("user_id, name, grad_year")
        .order("name");

      if (rosterRes.error) {
        setErr(rosterRes.error.message);
        return;
      }
      setRoster(rosterRes.data ?? []);
    }

    load();
  }, [loading, profile]);

  async function handleEditTeam() {
    if (!isEditing) {
      setNewTeamName(team ?? "");
      setIsEditing(true);
      return;
    }

    // Save the new team name
    if (!profile) return;
    setSaving(true);
    setErr(null);

    const { error } = await supabase
      .from("coaches")
      .update({ team_name: newTeamName })
      .eq("user_id", profile.user_id);

    setSaving(false);

    if (error) {
      setErr(error.message);
    } else {
      setTeam(newTeamName);
      setIsEditing(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setNewTeamName("");
  }

  if (loading) return null;
  if (!profile) return <main className="p-6">Please log in.</main>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        {profile.role === "coach" && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Team Name</div>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Enter team name"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleEditTeam}
                      disabled={saving}
                      className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold text-gray-900">{team ?? "(no team name)"}</div>
                  <button
                    onClick={handleEditTeam}
                    className="px-5 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Invite Code</div>
              <div className="font-mono text-2xl font-bold text-gray-900">{code ?? "—"}</div>
              <button
                className={`px-6 py-3 font-medium rounded-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
                onClick={() => {
                  if (code) {
                    navigator.clipboard.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                disabled={!code}
              >
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Team Roster</div>
              {roster.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No players yet.</p>
                  <p className="text-sm mt-2">Share your invite code with players to add them to your roster.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roster.map((p) => (
                    <div key={p.user_id} className="border-2 border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all">
                      <div className="font-semibold text-lg text-gray-900">{p.name ?? "Unnamed"}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Graduation Year: <span className="font-medium">{p.grad_year ?? "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
