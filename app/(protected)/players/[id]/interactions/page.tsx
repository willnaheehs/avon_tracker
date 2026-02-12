"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type Interaction = {
  id: string;
  type: string | null;
  occurred_on: string;
  notes: string | null;
  subject_user_id: string;
  college_name?: string | null;
};

type PlayerInfo = {
  name: string | null;
  grad_year: number | null;
  team_name: string | null;
};

export default function PlayerInteractionsPage() {
  const params = useParams();
  const playerId = params.id as string;
  const { loading, profile } = useProfile();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // dropdown menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function deleteInteraction(id: string) {
    if (!window.confirm("Delete this log? This cannot be undone.")) return;

    setError(null);

    const { error } = await supabase.from("interactions").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    setInteractions((prev) => prev.filter((x) => x.id !== id));
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  useEffect(() => {
    async function load() {
      if (!profile || !playerId) return;

      setError(null);

      // Load player info
      const playerRes = await supabase
        .from("profiles")
        .select("name, grad_year, team_id")
        .eq("user_id", playerId)
        .single();

      if (playerRes.error) {
        setError(playerRes.error.message);
        return;
      }

      // Load team name if player has a team
      let teamName = null;
      if (playerRes.data.team_id) {
        const teamRes = await supabase
          .from("teams")
          .select("name")
          .eq("id", playerRes.data.team_id)
          .single();

        if (!teamRes.error) {
          teamName = teamRes.data.name;
        }
      }

      setPlayerInfo({
        name: playerRes.data.name,
        grad_year: playerRes.data.grad_year,
        team_name: teamName,
      });

      // Load interactions for this player
      const { data, error } = await supabase
        .from("interactions")
        .select("id, type, occurred_on, notes, subject_user_id, college_name")
        .eq("subject_user_id", playerId)
        .order("occurred_on", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setInteractions((data ?? []) as Interaction[]);
    }

    if (!loading) load();
  }, [loading, profile, playerId]);

  if (loading) return null;

  if (!profile) {
    return (
      <main className="p-6">
        You must be signed in to view interactions.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {playerInfo?.name ?? "Player"}'s Interactions
              </h1>
              <div className="flex items-center gap-3 mt-3">
                {playerInfo?.grad_year && (
                  <span className="border-2 border-gray-300 px-4 py-1 rounded-full text-sm font-medium bg-gray-50">
                    Class of {playerInfo.grad_year}
                  </span>
                )}
                {playerInfo?.team_name && (
                  <span className="border-2 border-gray-300 px-4 py-1 rounded-full text-sm font-medium bg-[#9DCFF5]">
                    {playerInfo.team_name}
                  </span>
                )}
                {interactions.length > 0 && (
                  <span className="border-2 border-gray-300 px-4 py-1 rounded-full text-sm font-medium bg-gray-50">
                    {interactions.length} Total
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/interactions"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all shadow-md"
              >
                Back to All
              </Link>
              <Link
                href="/interactions/new"
                className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
              >
                Log Interaction
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {interactions.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xl text-gray-900 truncate mb-1">
                    {r.type ?? "(unknown)"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(r.occurred_on).toLocaleDateString()}
                  </div>
                </div>

                <div className="relative" ref={openMenuId === r.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                    aria-label="Interaction options"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                      <circle cx="8" cy="2" r="1.5"/>
                      <circle cx="8" cy="8" r="1.5"/>
                      <circle cx="8" cy="14" r="1.5"/>
                    </svg>
                  </button>

                  {openMenuId === r.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <Link
                        href={`/interactions/${r.id}/edit`}
                        onClick={() => setOpenMenuId(null)}
                        className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 border-b border-gray-100"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          deleteInteraction(r.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-all text-sm font-medium text-red-600 rounded-b-lg"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {r.college_name && (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                      College/University
                    </div>
                    <div className="font-bold text-lg text-gray-900">{r.college_name}</div>
                  </div>
                )}

                {r.notes && (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                      Notes
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">{r.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {interactions.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-700 text-lg font-medium mb-3">No interactions yet.</p>
              <p className="text-gray-500 text-sm">Click "Log Interaction" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
