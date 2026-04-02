"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type ClientProfile = {
  name: string | null;
  role: string;
  user_id: string;
};

export default function EditPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, profile } = useProfile();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, role")
        .eq("user_id", id)
        .maybeSingle();

      if (error) {
        setErr(error.message);
        return;
      }

      setClient((data as ClientProfile | null) ?? null);
    }

    if (!loading && profile) load();
  }, [loading, profile, id]);

  if (loading) return null;
  if (!profile) return <main className="p-6">Account not registered.</main>;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#9DCFF5] to-[#7ab8e8] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900">Client Profile</h1>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500 font-medium">Name</div>
            <div className="text-xl font-semibold text-gray-900">{client?.name ?? "Unnamed client"}</div>
          </div>

          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500 font-medium">Role</div>
            <div className="text-lg text-gray-800">{client?.role ?? "Unknown"}</div>
          </div>

          <p className="text-gray-600">
            Client edits are currently self-managed. This page is here as a read-only profile checkpoint while
            we finish the provider-facing tools.
          </p>

          <Link href={`/players/${id}/interactions`} className="inline-block text-black font-medium underline">
            Back to thread history
          </Link>
        </div>
      </div>
    </main>
  );
}
