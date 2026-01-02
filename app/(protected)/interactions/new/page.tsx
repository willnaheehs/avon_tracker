"use client";

// Page to create a new interaction.  Players log interactions for
// themselves, while coaches select a player from their roster.  The
// interaction records the date (today), type and notes.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function NewInteractionPage() {
  const { loading, profile } = useProfile();
  const router = useRouter();
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [roster, setRoster] = useState<{ user_id: string; name: string | null }[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load roster for coaches
  useEffect(() => {
    async function loadRoster() {
      if (profile?.role === "coach") {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, name")
          .eq("coach_user_id", profile.user_id)
          .eq("role", "player")
          .order("name", { ascending: true });
        setRoster(data ?? []);
      }
    }
    if (profile) loadRoster();
  }, [profile]);

  if (loading) return null;
  if (!profile) {
    return <main className="p-6">Account not registered.</main>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    // For coaches, ensure a player is selected
    if (profile.role === "coach" && !subjectId) {
      setErr("Select a player to log an interaction for.");
      return;
    }
    setSaving(true);
    const subject_user_id = profile.role === "coach" ? subjectId : profile.user_id;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { error } = await supabase.from("interactions").insert([
      {
        subject_user_id,
        created_by_user_id: profile.user_id,
        occurred_on: today,
        type: type || null,
        notes: notes || null,
      },
    ]);
    setSaving(false);
    if (error) {
      setErr(error.message);
    } else {
      // Go back to interactions list
      router.push("/interactions");
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Log Interaction</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <form onSubmit={submit} className="space-y-3">
        {profile.role === "coach" && (
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">Select Player</option>
            {roster.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.name ?? p.user_id}
              </option>
            ))}
          </select>
        )}
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type (e.g., call, visit)"
          className="border rounded px-2 py-1 w-full"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="border rounded px-2 py-1 w-full h-24"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </main>
  );
}