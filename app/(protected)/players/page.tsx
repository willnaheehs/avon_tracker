"use client";

// Simplified players list page.  Only coaches may view this page and
// see the players on their roster.  Players no longer live in a
// separate `players` table; instead, a player is a user in the
// `profiles` table with role='player' and coach_user_id set.

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type Player = {
  user_id: string;
  name: string | null;
  grad_year: number | null;
};

export default function PlayersPage() {
  const { loading, profile } = useProfile();
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (profile?.role !== "coach") return;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, grad_year")
        .eq("role", "player")
        .eq("coach_user_id", profile.user_id)
        .order("name", { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setPlayers(data ?? []);
      }
    }
    if (!loading) load();
  }, [loading, profile]);

  if (loading) return null;
  if (!profile) return <main className="p-6">You must be signed in.</main>;
  if (profile.role !== "coach") {
    return <main className="p-6">You don’t have permission to view this page.</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Players</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left border px-2 py-1">Name</th>
            <th className="text-left border px-2 py-1">Grad Year</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.user_id} className="border-b">
              <td className="border px-2 py-1">{p.name ?? p.user_id}</td>
              <td className="border px-2 py-1">{p.grad_year ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}