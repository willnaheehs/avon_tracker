"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function EditInteractionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, profile } = useProfile();
  const [body, setBody] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("notes")
        .select("id, body, thread_id")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setErr(error.message);
        return;
      }

      if (!data) {
        setErr("Note not found.");
        return;
      }

      setBody(data.body);
      setThreadId(data.thread_id);
    }

    if (!loading && profile) load();
  }, [loading, profile, id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    const { error } = await supabase
      .from("notes")
      .update({ body: body.trim() })
      .eq("id", id);

    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(profile?.role === "provider" ? "/interactions" : `/players/${profile?.user_id}/interactions`);
    router.refresh();
  }

  if (loading) return null;
  if (!profile) return <main className="p-6">Account not registered.</main>;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Note</h1>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={save} className="space-y-5">
            {threadId && (
              <div className="text-sm text-gray-500">
                Editing note in thread <span className="font-mono">{threadId}</span>
              </div>
            )}

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all h-40 resize-none"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
