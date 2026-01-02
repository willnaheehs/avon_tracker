"use client";

// Simplified profile hook for the new schema.  In this model
// a user has exactly one profile row keyed by their auth user ID.
// Players have a `coach_user_id` pointing to their coach's user ID.
// Coaches and admins have `coach_user_id = null`.

import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

/**
 * Shape of a user profile in the simplified roster model.
 */
export type Profile = {
  user_id: string;
  role: "player" | "coach" | "admin";
  name: string | null;
  grad_year: number | null;
  coach_user_id: string | null;
};

/**
 * Return type for the `useProfile` hook.
 */
export type UseProfileReturn = {
  /** True while loading profile data from Supabase */
  loading: boolean;
  /** The profile row for the logged-in user, or null if not signed in */
  profile: Profile | null;
  /** An error string if something went wrong */
  error: string | null;
  /** Force a refresh of the profile data */
  refresh: () => Promise<void>;
};

/**
 * Fetch the currently logged-in user's profile from the `profiles` table.
 * This hook hides all of the Supabase boilerplate so that components
 * can simply access the profile object and a loading state.  It will
 * automatically refresh if the user signs out or their profile is
 * updated (you can call `refresh()` to force a reload).
 */
export function useProfile(): UseProfileReturn {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Get the current session (auth user)
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      setError(sessionErr.message);
      setProfile(null);
      setLoading(false);
      return;
    }
    const session = sessionData.session;
    if (!session) {
      // Not signed in
      setProfile(null);
      setLoading(false);
      return;
    }
    // Fetch the profile row for this user.  The new schema stores
    // player/coach metadata directly on the profiles table and
    // optionally links a player to their coach via coach_user_id.
    const { data, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, role, name, grad_year, coach_user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (profErr) {
      setError(profErr.message);
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(data as Profile | null);
    setLoading(false);
  }, []);

  // Initially load the profile when the component mounts.
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