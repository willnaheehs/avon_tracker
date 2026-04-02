"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import ProtectedLoading from "@/components/ProtectedLoading";

function formatRole(role: string) {
  if (role === "provider") return "Provider";
  if (role === "client") return "Client";
  return "Admin";
}

export default function AppHeader() {
  const router = useRouter();
  const { loading, profile } = useProfile();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadOrganizationLabel() {
      if (!profile) {
        setOrganizationName(null);
        return;
      }

      if (profile.role === "provider") {
        const { data } = await supabase
          .from("provider_organizations")
          .select("organizations(name)")
          .eq("provider_user_id", profile.user_id)
          .order("created_at", { ascending: true })
          .limit(1);

        const name = data?.[0]?.organizations?.name;
        setOrganizationName(typeof name === "string" ? name : null);
        return;
      }

      if (profile.role === "client") {
        const { data } = await supabase
          .from("provider_client_assignments")
          .select("organizations(name)")
          .eq("client_user_id", profile.user_id)
          .eq("status", "active")
          .order("created_at", { ascending: true })
          .limit(1);

        const name = data?.[0]?.organizations?.name;
        setOrganizationName(typeof name === "string" ? name : null);
        return;
      }

      setOrganizationName(null);
    }

    loadOrganizationLabel();
  }, [profile]);

  async function logout() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return <ProtectedLoading message="Loading your workspace header and organization context." />;
  }

  return (
    <header className="border-b border-white/60 bg-[linear-gradient(90deg,_rgba(7,65,102,0.95),_rgba(10,123,220,0.92)_38%,_rgba(77,155,28,0.88)_100%)] shadow-[0_14px_45px_rgba(9,66,97,0.18)] backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-4 min-w-0">
          <div className="rounded-2xl border border-white/30 bg-white/12 px-3 py-2 backdrop-blur">
            <img src="/CarePath.png" alt="CarePath logo" className="h-10 w-auto object-contain sm:h-12" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-black tracking-[0.18em] text-white sm:text-xl">CAREPATH</div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/80 sm:text-sm">
              <span>{formatRole(profile?.role ?? "admin")} workspace</span>
              {organizationName && (
                <span className="rounded-full bg-white/16 px-3 py-1 text-white">{organizationName}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold text-white">{profile.name ?? "Unnamed user"}</div>
              <div className="text-xs text-white/75">{formatRole(profile.role)}</div>
            </div>
          )}

          <button
            onClick={logout}
            disabled={busy}
            className="rounded-xl border border-white/35 bg-white px-4 py-2.5 text-sm font-bold text-[#0b4a83] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#f5fbff] disabled:opacity-50"
          >
            {busy ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </div>
    </header>
  );
}
