"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uiReady, setUiReady] = useState(false);

  useEffect(() => {
    setUiReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const uid = sess.session?.user?.id;
      if (!uid) throw new Error("No session after login.");

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
    <div className="min-h-screen w-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,145,255,0.26),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(105,201,49,0.24),_transparent_28%),linear-gradient(160deg,_#eff9ff_0%,_#e7f8f2_50%,_#fdfbe9_100%)] flex flex-col">
      <div className="flex justify-center pt-10 pb-6 px-4">
        <div className="rounded-[2.25rem] border border-white/90 bg-white/75 p-5 shadow-[0_24px_60px_rgba(15,111,214,0.16)] backdrop-blur">
          <img src="/CarePath.png" alt="CarePath logo" className="w-80 max-w-full object-contain sm:w-96" />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 pb-20">
        <div
          data-login-ready={uiReady ? "true" : "false"}
          className="w-full max-w-md rounded-[2rem] border border-white/90 bg-white/88 p-8 shadow-[0_28px_80px_rgba(23,90,73,0.18)] backdrop-blur"
        >
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Welcome</h1>
          <p className="text-center text-[#55776a] mb-8">Sign in to your care team workspace</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                className="w-full rounded-xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f8df4] focus:border-transparent transition"
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
                className="w-full rounded-xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f8df4] focus:border-transparent transition"
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
              className="w-full rounded-xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] text-white px-4 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
              disabled={busy || !uiReady}
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Need an account?{" "}
              <a href="/register" className="text-[#4d9b1c] hover:text-[#3e7f15] font-semibold underline">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
