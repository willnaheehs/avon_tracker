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
    <header className="flex items-center justify-between gap-4 bg-black px-8 py-5 border-b-4 border-black">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-black text-white">MY RECRUITING PROFILE</div>
        {teamName && (
          <span className="border-2 border-white bg-[#9DCFF5] px-4 py-1.5 text-sm font-bold text-black rounded-lg">
            {teamName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {profile ? (
          <>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{profile.name ?? "Unnamed"}</div>
              <div className="text-xs text-gray-300 flex items-center gap-1.5 justify-end font-medium">
                <span>
                  {profile.role === "coach"
                    ? "Coach"
                    : profile.role === "player"
                    ? "Player"
                    : profile.role}
                </span>
                {teamName && profile.role === "player" && (
                  <>
                    <span>•</span>
                    <span className="font-bold">{teamName}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              disabled={busy}
              className="rounded-lg bg-white px-5 py-2.5 text-sm text-black font-bold hover:bg-gray-200 disabled:opacity-50 transition-all border-2 border-white"
            >
              {busy ? "Logging out..." : "Log Out"}
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-white px-5 py-2.5 text-sm text-black font-bold hover:bg-gray-200 transition-all border-2 border-white"
          >
            Log In
          </button>
        )}
      </div>
    </header>
  );
}
