"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import ProtectedLoading from "@/components/ProtectedLoading";

type OrganizationRow = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  membership_role: "owner" | "member";
};

type CaseloadRow = {
  assignment_id: string;
  client_name: string | null;
  client_user_id: string;
  organization_name: string | null;
  status: string | null;
};

export default function TeamPage() {
  const { loading, profile } = useProfile();
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [caseload, setCaseload] = useState<CaseloadRow[]>([]);
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (profile?.role !== "provider") return;

    setError(null);

    const organizationsRes = await supabase
      .from("provider_organizations")
      .select("membership_role, organizations(id, name, invite_code, created_at)")
      .eq("provider_user_id", profile.user_id)
      .order("created_at", { ascending: true });

    if (organizationsRes.error) {
      setError(organizationsRes.error.message);
      return;
    }

    const organizationRows = (organizationsRes.data ?? [])
      .map((row: any) => {
        const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
        if (!organization) return null;
        return {
          id: organization.id,
          name: organization.name,
          invite_code: organization.invite_code,
          created_at: organization.created_at,
          membership_role: row.membership_role,
        } satisfies OrganizationRow;
      })
      .filter(Boolean) as OrganizationRow[];

    setOrganizations(organizationRows);

    const caseloadRes = await supabase
      .from("my_caseload")
      .select("assignment_id, client_name, client_user_id, organization_name, status")
      .order("created_at", { ascending: false });

    if (caseloadRes.error) {
      setError(caseloadRes.error.message);
      return;
    }

    setCaseload((caseloadRes.data ?? []) as CaseloadRow[]);
  }

  useEffect(() => {
    if (!loading && profile?.role === "provider") {
      loadData();
    }
  }, [loading, profile]);

  async function createOrganization(e: React.FormEvent) {
    e.preventDefault();
    const name = newOrganizationName.trim();
    if (!name) {
      setError("Organization name cannot be empty.");
      return;
    }

    setCreating(true);
    setError(null);

    const { error } = await supabase.rpc("create_organization", { p_name: name });
    setCreating(false);

    if (error) {
      setError(error.message);
      return;
    }

    setNewOrganizationName("");
    await loadData();
  }

  if (loading) return <ProtectedLoading message="Loading your organizations and invite codes." />;
  if (!profile) return <main className="p-6">You must be signed in.</main>;
  if (profile.role !== "provider") {
    return <main className="p-6">Only providers can manage organizations.</main>;
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-8 shadow-[0_24px_70px_rgba(12,83,121,0.14)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-[#eef9ff] px-4 py-2 text-xs font-black tracking-[0.18em] text-[#0a7bdc] uppercase">
                Organization Hub
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[#16322a]">Organizations</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#55776a]">
                Create organizations, share invite codes, and keep a quick pulse on your active
                client relationships.
              </p>
            </div>
            <div className="rounded-2xl bg-[linear-gradient(135deg,_#eef9ff,_#f4fbe8)] px-5 py-4 text-sm text-[#406657]">
              <div className="font-bold text-[#16322a]">{organizations.length} organizations</div>
              <div>{caseload.length} active assignments</div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
          <form onSubmit={createOrganization} className="flex flex-col gap-4 md:flex-row">
            <input
              value={newOrganizationName}
              onChange={(e) => setNewOrganizationName(e.target.value)}
              placeholder="New organization name"
              className="flex-1 rounded-2xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 text-[#16322a] focus:outline-none focus:ring-2 focus:ring-[#0f8df4]"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-2xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] px-6 py-3 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Organization"}
            </button>
          </form>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
          <section className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#16322a]">Your Organizations</h2>
              <span className="rounded-full bg-[#eef9ff] px-3 py-1 text-sm font-bold text-[#0a7bdc]">
                {organizations.length} total
              </span>
            </div>

            <div className="space-y-4">
              {organizations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#b9dff4] bg-[#fbfeff] p-6 text-[#55776a]">
                  No organizations yet. Create one above to start inviting clients.
                </div>
              ) : (
                organizations.map((organization) => (
                  <div
                    key={organization.id}
                    className="rounded-[1.5rem] border border-[#d6eefc] bg-[linear-gradient(135deg,_#fafdff,_#f5fbeb)] p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-black text-[#16322a]">{organization.name}</div>
                        <div className="mt-1 text-sm capitalize text-[#55776a]">
                          {organization.membership_role} access
                        </div>
                      </div>
                      <span className="rounded-full bg-[linear-gradient(135deg,_#69c931,_#4d9b1c)] px-3 py-1 text-xs font-black tracking-[0.14em] text-white">
                        {organization.invite_code}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#55776a]">
                      Share this invite code with clients so they can join the right organization.
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#16322a]">Active Caseload</h2>
              <Link href="/players" className="text-sm font-bold text-[#0b6fd6] underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {caseload.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#cde6b4] bg-[#fcfff6] p-6 text-[#55776a]">
                  No clients assigned yet.
                </div>
              ) : (
                caseload.slice(0, 8).map((row) => (
                  <Link
                    key={row.assignment_id}
                    href={`/players/${row.client_user_id}/interactions`}
                    className="block rounded-2xl border border-[#d6eefc] bg-white/90 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="font-bold text-[#16322a]">{row.client_name ?? "Unnamed client"}</div>
                    <div className="mt-1 text-sm text-[#55776a]">
                      {row.organization_name ?? "Unknown organization"} • {row.status ?? "unknown"}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
