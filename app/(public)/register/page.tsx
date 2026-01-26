"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

type Tab = "coach" | "player";

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("coach");

  // common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // coach fields
  const [coachName, setCoachName] = useState("");
  const [teamName, setTeamName] = useState(""); // optional label; can keep or remove later

  // player fields
  const [playerName, setPlayerName] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [teamCode, setTeamCode] = useState(""); // rename in state for clarity

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function afterAuthRpc() {
    if (tab === "coach") {
      const { error } = await supabase.rpc("register_coach", {
        p_name: coachName,
        p_team: teamName, // ok even if you later make it optional in SQL
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("register_player", {
        p_name: playerName,
        p_grad_year: gradYear === "" ? null : Number(gradYear),
        p_team_code: teamCode, // THIS must match your new SQL function signature
      });
      if (error) throw error;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      // 1) sign up
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) throw signUpErr;

      // 2) sign in (ensures session exists for auth.uid() inside RPC)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;

      // 3) create profile row via RPC
      await afterAuthRpc();

      // 4) go to app
      router.replace("/interactions");
    } catch (e: any) {
      setErr(e?.message ?? "Registration failed");
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[#9DCFF5] flex flex-col overflow-y-auto">
      <div className="flex justify-center pt-8 pb-6">
        <img
          src="/2way-logo.png"
          alt="2W Lacrosse Logo"
          className="w-72 h-72 rounded-full object-cover"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Create Account</h1>
          <p className="text-center text-gray-600 mb-6">Join your recruiting log</p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              className={`flex-1 rounded-lg px-4 py-2.5 font-medium transition-all ${
                tab === "coach"
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setTab("coach")}
            >
              Coach
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-4 py-2.5 font-medium transition-all ${
                tab === "player"
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setTab("player")}
            >
              Player
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {tab === "coach" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Your full name"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    required
                  />
                </div>

                {/* You can make this optional if you want */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Label (optional)</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="e.g., My Program"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Your full name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    type="number"
                    placeholder="e.g., 2027"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Invite Code</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Enter team invite code"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
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
              className="w-full rounded-lg bg-black px-4 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              disabled={busy}
            >
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <a className="text-black font-medium hover:underline" href="/login">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
