"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Confirm we have a session + user id
      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const uid = sess.session?.user?.id;
      if (!uid) throw new Error("No session after login.");

      // Check if this user is "registered" in our app (has a profile row)
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (profErr) throw profErr;

      if (!prof) {
        await supabase.auth.signOut();
        throw new Error("Account not registered. Please create an account first.");
      }

      router.replace("/interactions");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm">
        No account? <a className="underline" href="/register">Create one</a>
      </p>
    </main>
  );
}
