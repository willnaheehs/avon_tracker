"use client";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type Player = { id: string; first_name: string; last_name: string; grad_year: number };

export default function PlayersPage() {
  const { loading, profile } = useProfile();
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (profile?.role !== "coach") return;
    (async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, first_name, last_name, grad_year")
        .order("last_name", { ascending: true });
      if (error) setError(error.message);
      else setPlayers(data ?? []);
    })();
  }, [loading, profile]);

  if (loading) return null;
  if (profile?.role !== "coach") return <p>You don’t have permission to view this page.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Players</h1>
      {/* existing NewPlayerForm if you have it, coaches-only */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th><th>Grad</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.last_name}, {p.first_name}</td>
              <td>{p.grad_year}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
    </div>
  );
}
