"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function NewInteractionPage() {
  const { loading, profile } = useProfile();
  const router = useRouter();
  const [type, setType] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

    if (loading) return null;
    if (profile?.role !== "player") {
    return <main className="p-6">Only players can log interactions.</main>;
    }
    if (!profile?.player_id) {
    return <main className="p-6">Your account isn’t linked to a player record yet. Ask your coach to link it.</main>;
    }

    async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Guard in handler: set error, don't render
    if (!profile || profile.role !== "player") {
        setErr("Only players can log interactions.");
        return;
    }
    if (!profile.player_id) {
        setErr("Your account isn’t linked to a player record yet. Ask your coach to link it.");
        return;
    }

    setSaving(true);
    const { error } = await supabase.from("interactions").insert({
        player_id: profile.player_id,
        type,
        summary: summary || null,
        notes: notes || null,
    });
    setSaving(false);

    if (error) {
        setErr(error.message);
        return;
    }
    router.replace("/interactions");
    }


  return (
    <main className="p-6 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Log Interaction</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Type (e.g. call, practice, visit)"
          value={type}
          onChange={(e)=>setType(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Short summary"
          value={summary}
          onChange={(e)=>setSummary(e.target.value)}
        />
        <textarea
          className="w-full border rounded p-2 h-28"
          placeholder="Notes"
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="px-4 py-2 border rounded" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </main>
  );
}
