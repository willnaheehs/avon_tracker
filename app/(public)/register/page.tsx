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
  const [teamName, setTeamName] = useState("");

  // player fields
  const [playerName, setPlayerName] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [coachCode, setCoachCode] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function afterAuthRpc() {
    // Call the appropriate RPC to create the profile row
    if (tab === "coach") {
      const { error } = await supabase.rpc("register_coach", {
        p_name: coachName,
        p_team: teamName,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("register_player", {
        p_name: playerName,
        p_grad_year: gradYear === "" ? null : Number(gradYear),
        p_coach_code: coachCode,
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

    // 2) sign in (guarantees session exists)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) throw signInErr;

    // 3) create profile (THIS is what you’re missing)
    await afterAuthRpc();

    // 4) go to app
    router.replace("/interactions");
  } catch (e: any) {
    setErr(e?.message ?? "Registration failed");
    // optional: sign out if profile creation failed mid-way
    await supabase.auth.signOut();
  } finally {
    setBusy(false);
  }
}


  return (
    <main className="mx-auto max-w-lg p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>

      <div className="flex gap-2">
        <button
          className={`rounded px-3 py-1.5 border ${tab === "coach" ? "bg-black text-white" : ""}`}
          onClick={() => setTab("coach")}
        >
          Coach
        </button>
        <button
          className={`rounded px-3 py-1.5 border ${tab === "player" ? "bg-black text-white" : ""}`}
          onClick={() => setTab("player")}
        >
          Player
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {tab === "coach" ? (
          <>
            <input
              className="w-full rounded border p-2"
              placeholder="Your name"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              required
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </>
        ) : (
          <>
            <input
              className="w-full rounded border p-2"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
            <input
              className="w-full rounded border p-2"
              type="number"
              placeholder="Grad year (e.g., 2027)"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Coach invite code"
              value={coachCode}
              onChange={(e) => setCoachCode(e.target.value)}
              required
            />
          </>
        )}

        {err && <div className="text-sm text-red-600">{err}</div>}
        <button
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm">
        Already have an account? <a className="underline" href="/login">Log in</a>
      </p>
    </main>
  );
}
