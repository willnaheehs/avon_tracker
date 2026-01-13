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
    <div className="h-screen w-screen bg-[#9DCFF5] flex flex-col overflow-hidden">
      <div className="flex justify-center pt-8 pb-6">
        <img
          src="/2way-logo.png"
          alt="2W Lacrosse Logo"
          className="w-72 h-72 rounded-full object-cover"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-32">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Welcome</h1>
          <p className="text-center text-gray-600 mb-8">Sign in to your recruiting log</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9DCFF5] focus:border-transparent transition"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9DCFF5] focus:border-transparent transition"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {err}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-black text-white px-4 py-3 font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a href="/register" className="text-[#9DCFF5] hover:text-[#7ab8e0] font-semibold underline">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
