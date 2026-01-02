"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function AppHeader() {
  const router = useRouter();
  const { loading, profile } = useProfile();
  const [teamName, setTeamName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If logged out, clear team label
    if (!profile) {
      setTeamName(null);
      return;
    }

    async function loadTeam() {
      const { data, error } = await supabase.rpc("get_my_team_name");
      if (!error) setTeamName(data ?? null);
    }

    loadTeam();
  }, [profile]);

async function logout() {
  console.log("logout clicked");
  setBusy(true);

  const { error } = await supabase.auth.signOut();
  console.log("signOut error:", error);

  setBusy(false);

  // Always navigate even if signOut errors (helps you see the login page)
  router.replace("/login");
  router.refresh();
}


  if (loading) return null;

  return (
    <header className="flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">Avon Tracker</div>
        {teamName && (
          <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
            {teamName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {profile ? (
          <>
            <div className="text-right">
              <div className="text-sm font-medium">{profile.name ?? "Unnamed"}</div>
              <div className="text-xs text-slate-500">
                {profile.role === "coach"
                  ? "Coach"
                  : profile.role === "player"
                  ? "Player"
                  : profile.role}
              </div>
            </div>

            <button
              onClick={logout}
              disabled={busy}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {busy ? "Logging out…" : "Log out"}
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Log in
          </button>
        )}
      </div>
    </header>
  );
}
