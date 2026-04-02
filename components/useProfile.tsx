"use client";

import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import type { ProfileRole } from "@/lib/database.types";

export type Profile = {
  user_id: string;
  role: ProfileRole;
  name: string | null;
  created_at: string;
};

export type UseProfileReturn = {
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

    const { data, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, role, name, created_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileErr) {
      setError(profileErr.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    profile,
    error,
    refresh: load,
  };
}
