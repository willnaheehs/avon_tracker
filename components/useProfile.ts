// components/useProfile.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export type Profile = {
  user_id: string;
  role: "coach" | "player";
  player_id: string | null;
  name: string | null;
  grad_year: number | null;
};

type UseProfileReturn = {
  loading: boolean;
  profile: Profile | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useProfile(): UseProfileReturn {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1) get session first
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      setError(sessionErr.message);
      setProfile(null);
      setLoading(false);
      return;
    }
    const session = sessionData.session;
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // 2) fetch profile fields (incl. name & grad_year)
    const { data, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, role, player_id, name, grad_year")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profErr) {
      setError(profErr.message);
      setProfile(null);
    } else {
      setProfile((data as Profile) ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // initial load + keep in sync with auth changes
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { loading, profile, error, refresh: load };
}
