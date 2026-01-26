"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

export default function EditPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, profile } = useProfile();

  const [name, setName] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !profile) return;

    (async () => {
      setErr(null);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, grad_year, role, coach_user_id")
        .eq("user_id", id)
        .maybeSingle();

      if (error) return setErr(error.message);
      if (!data) return setErr("Player not found.");

      setName(data.name ?? "");
      setGradYear(data.grad_year ?? "");
    })();
  }, [loading, profile, id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setErr(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name || null,
        grad_year: gradYear === "" ? null : Number(gradYear),
      })
      .eq("user_id", id)
      .eq("role", "player")
      .eq("coach_user_id", profile.user_id);

    setSaving(false);

    if (error) return setErr(error.message);

    router.push("/team");
    router.refresh();
  }

  if (loading) return null;
  if (!profile) return <main className="p-6">Account not registered.</main>;
  if (profile.role !== "coach") return <main className="p-6">Only coaches can edit players.</main>;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Player</h1>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
              <input
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value === "" ? "" : Number(e.target.value))}
                inputMode="numeric"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
