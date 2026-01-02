"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type Player = { user_id: string; name: string | null };

export default function InteractionForm() {
  const { loading, profile } = useProfile();

  const [players, setPlayers] = useState<Player[]>([]);
  const [subjectUserId, setSubjectUserId] = useState("");
  const [type, setType] = useState("call");
  const [occurredOn, setOccurredOn] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) return;

    async function load() {
      setError(null);

      if (profile.role === "coach") {
        // Recommended: use the my_roster view (already scoped by auth.uid())
        const pRes = await supabase
          .from("my_roster")
          .select("user_id, name")
          .order("name");

        if (pRes.error) setError(pRes.error.message);
        else setPlayers((pRes.data as Player[]) ?? []);
      }

      if (profile.role === "player") {
        setSubjectUserId(profile.user_id);
      }
    }

    load();
  }, [loading, profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!profile) {
      setError("No profile loaded. Please refresh and try again.");
      return;
    }

    if (!subjectUserId) {
      setError("Please select a player.");
      return;
    }

    // Keep created_by_user_id in payload to satisfy INSERT RLS check.
    const payload = {
      subject_user_id: subjectUserId,
      created_by_user_id: profile.user_id,
      occurred_on: occurredOn,
      type,
      notes: notes || null,
    };

    const { error } = await supabase.from("interactions").insert(payload);

    if (error) {
      setError(error.message);
      return;
    }

    setOk(true);
    setNotes("");
    setTimeout(() => setOk(false), 2500);
  }

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (!profile) return <div className="text-center p-4">Please log in.</div>;

  const isCoach = profile.role === "coach";

  return (
    <form
      onSubmit={submit}
      className="max-w-md mx-auto space-y-3 bg-white border p-4 rounded"
    >
      <h1 className="text-lg font-semibold">Log Interaction</h1>

      {isCoach ? (
        <>
          <label className="block text-sm font-medium">Player</label>
          <select
            required
            className="w-full border p-2 rounded"
            value={subjectUserId}
            onChange={(e) => setSubjectUserId(e.target.value)}
          >
            <option value="">Select player</option>
            {players.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.name ?? "Unnamed Player"}
              </option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-sm text-neutral-600">Logging for your profile.</p>
      )}

      <label className="block text-sm font-medium">Type</label>
      <select
        className="w-full border p-2 rounded"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {[
          "call",
          "email",
          "text",
          "dm",
          "visit",
          "unofficial",
          "official",
          "prospect_day",
          "camp",
          "offer",
          "commit",
          "portal",
          "other",
        ].map((t) => (
          <option key={t} value={t}>
            {t.replace("_", " ")}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium">Date</label>
      <input
        className="w-full border p-2 rounded"
        type="date"
        value={occurredOn}
        onChange={(e) => setOccurredOn(e.target.value)}
        required
      />

      <label className="block text-sm font-medium">Notes</label>
      <textarea
        className="w-full border p-2 rounded"
        rows={4}
        placeholder="Add details about this interaction..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-300"
        disabled={!subjectUserId}
      >
        Save Interaction
      </button>

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
      {ok && <p className="text-green-700 text-sm">✓ Saved successfully!</p>}
    </form>
  );
}
