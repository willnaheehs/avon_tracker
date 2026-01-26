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
  const [collegeName, setCollegeName] = useState("");
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
        college_name: collegeName || null,
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
    <main className="min-h-screen bg-linear-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Log Interaction</h1>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={submit} className="space-y-5">
            {profile.role === "coach" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Player</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                >
                  <option value="">Select Player</option>
                  {roster.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.name ?? p.user_id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g., Phone call, Campus visit, Email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College/University</label>
              <input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="College or university name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details about this interaction"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all h-32 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? "Saving..." : "Save Interaction"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}