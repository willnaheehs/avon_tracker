"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function EditInteractionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, profile } = useProfile();

  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [occurredOn, setOccurredOn] = useState(""); // YYYY-MM-DD

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !profile) return;

    (async () => {
      setErr(null);

      const { data, error } = await supabase
        .from("interactions")
        .select("id,type,notes,college_name,occurred_on")
        .eq("id", id)
        .maybeSingle();

      if (error) return setErr(error.message);
      if (!data) return setErr("Interaction not found.");

      setType(data.type ?? "");
      setNotes(data.notes ?? "");
      setCollegeName(data.college_name ?? "");
      setOccurredOn((data.occurred_on ?? "").slice(0, 10));
    })();
  }, [loading, profile, id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    const { error } = await supabase
      .from("interactions")
      .update({
        type: type || null,
        notes: notes || null,
        college_name: collegeName || null,
        occurred_on: occurredOn || null,
      })
      .eq("id", id);

    setSaving(false);

    if (error) return setErr(error.message);

    router.push("/interactions");
    router.refresh();
  }

  if (loading) return null;
  if (!profile) return <main className="p-6">Account not registered.</main>;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Interaction</h1>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College/University</label>
              <input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all h-32 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
