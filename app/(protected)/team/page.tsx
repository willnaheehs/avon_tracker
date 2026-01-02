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

  if (loading) return null;
  if (!profile) return <main className="p-6">Please log in.</main>;

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Team</h1>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {profile.role === "coach" && (
        <>
          <div className="border rounded p-3 space-y-1">
            <div className="text-sm opacity-70">Team</div>
            <div className="font-medium">{team ?? "(no team name)"}</div>
          </div>

          <div className="border rounded p-3 space-y-2">
            <div className="text-sm opacity-70">Invite code</div>
            <div className="font-mono text-lg">{code ?? "—"}</div>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => code && navigator.clipboard.writeText(code)}
              disabled={!code}
            >
              Copy code
            </button>
          </div>

          <div className="border rounded p-3">
            <div className="text-sm opacity-70 mb-2">Roster</div>
            {roster.length === 0 ? (
              <div className="opacity-70">No players yet.</div>
            ) : (
              <ul className="space-y-2">
                {roster.map((p) => (
                  <li key={p.user_id} className="border rounded p-2">
                    <div className="font-medium">{p.name ?? "Unnamed"}</div>
                    <div className="text-sm opacity-70">
                      Grad year: {p.grad_year ?? "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
