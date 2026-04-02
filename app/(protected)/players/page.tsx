"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import ProtectedLoading from "@/components/ProtectedLoading";

type CaseloadRow = {
  assignment_id: string;
  client_name: string | null;
  client_user_id: string;
  organization_name: string | null;
  status: string | null;
};

export default function PlayersPage() {
  const { loading, profile } = useProfile();
  const [rows, setRows] = useState<CaseloadRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (profile?.role !== "provider") return;

      const { data, error } = await supabase
        .from("my_caseload")
        .select("assignment_id, client_name, client_user_id, organization_name, status")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setRows((data ?? []) as CaseloadRow[]);
    }

    if (!loading) load();
  }, [loading, profile]);

  if (loading) return <ProtectedLoading message="Loading your active caseload." />;
  if (!profile) return <main className="p-6">You must be signed in.</main>;
  if (profile.role !== "provider") {
    return <main className="p-6">Only providers can view the caseload page.</main>;
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-8 shadow-[0_24px_70px_rgba(12,83,121,0.14)] backdrop-blur">
          <h1 className="text-4xl font-black tracking-tight text-[#16322a]">Caseload</h1>
          <p className="mt-3 text-base leading-7 text-[#55776a]">
            Clients currently assigned to you across organizations.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cde6b4] bg-[#fcfff6] p-8 text-center text-[#55776a]">
              No clients are assigned to you yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {rows.map((row) => (
                <Link
                  key={row.assignment_id}
                  href={`/players/${row.client_user_id}/interactions`}
                  className="rounded-[1.5rem] border border-[#d6eefc] bg-[linear-gradient(135deg,_#fafdff,_#f5fbeb)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="text-xl font-black text-[#16322a]">{row.client_name ?? "Unnamed client"}</div>
                  <div className="mt-2 text-sm text-[#55776a]">{row.organization_name ?? "Unknown organization"}</div>
                  <div className="mt-5 inline-flex rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-[#0b6fd6]">
                    Open thread history
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
