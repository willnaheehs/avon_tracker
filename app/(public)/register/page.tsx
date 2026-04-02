"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

type Tab = "provider" | "client";

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("provider");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [providerName, setProviderName] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [clientName, setClientName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function afterAuthRpc() {
    if (tab === "provider") {
      const { error: registerError } = await supabase.rpc("register_provider", {
        p_name: providerName,
      });
      if (registerError) throw registerError;

      const trimmedOrganizationName = organizationName.trim();
      if (trimmedOrganizationName) {
        const { error: organizationError } = await supabase.rpc("create_organization", {
          p_name: trimmedOrganizationName,
        });
        if (organizationError) throw organizationError;
      }
      return;
    }

    const { error } = await supabase.rpc("register_client", {
      p_name: clientName,
      p_invite_code: inviteCode.trim().toUpperCase(),
    });
    if (error) throw error;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) throw signUpErr;

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;

      await afterAuthRpc();
      router.replace("/interactions");
    } catch (e: any) {
      setErr(e?.message ?? "Registration failed");
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,145,255,0.26),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(105,201,49,0.24),_transparent_28%),linear-gradient(160deg,_#eff9ff_0%,_#e7f8f2_50%,_#fdfbe9_100%)] flex flex-col overflow-y-auto">
      <div className="flex justify-center pt-10 pb-6 px-4">
        <div className="rounded-[2.25rem] border border-white/90 bg-white/75 p-5 shadow-[0_24px_60px_rgba(15,111,214,0.16)] backdrop-blur">
          <img src="/CarePath.png" alt="CarePath logo" className="w-80 max-w-full object-contain sm:w-96" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-[2rem] border border-white/90 bg-white/88 p-8 shadow-[0_28px_80px_rgba(23,90,73,0.18)] backdrop-blur">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Create Account</h1>
          <p className="text-center text-[#55776a] mb-6">Set up your provider or client account</p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              className={`flex-1 rounded-xl px-4 py-2.5 font-medium transition-all ${
                tab === "provider"
                  ? "bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] text-white shadow-md"
                  : "bg-[#eef8ff] text-[#33617a] hover:bg-[#dff0fb]"
              }`}
              onClick={() => setTab("provider")}
            >
              Provider
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl px-4 py-2.5 font-medium transition-all ${
                tab === "client"
                  ? "bg-[linear-gradient(135deg,_#69c931,_#4d9b1c)] text-white shadow-md"
                  : "bg-[#f4fbe8] text-[#48683a] hover:bg-[#ebf7d5]"
              }`}
              onClick={() => setTab("client")}
            >
              Client
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                className="w-full rounded-xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f8df4] focus:border-transparent transition-all"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                className="w-full rounded-xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f8df4] focus:border-transparent transition-all"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {tab === "provider" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f8df4] focus:border-transparent transition-all"
                    placeholder="Your full name"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Organization (optional)
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#d7ebb2] bg-[#fcfff6] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#69c931] focus:border-transparent transition-all"
                    placeholder="e.g., Downtown Sports Therapy"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f8df4] focus:border-transparent transition-all"
                    placeholder="Your full name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Invite Code
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#d7ebb2] bg-[#fcfff6] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#69c931] focus:border-transparent transition-all uppercase"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {err}
              </div>
            )}

            <button
              className="w-full rounded-xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] px-4 py-3 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
              disabled={busy}
            >
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <a className="text-[#0b6fd6] font-medium hover:underline" href="/login">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
