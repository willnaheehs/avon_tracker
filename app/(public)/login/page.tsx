"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (error) return setMsg(error.message);

    router.replace("/interactions");
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded p-2" type="email" placeholder="Email"
               value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password"
               value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {msg && <p className="text-sm">{msg}</p>}
        <button className="px-4 py-2 border rounded" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-sm">
        No account? <a className="underline" href="/register">Create one</a>
      </p>
      <p className="text-sm">
        Forgot password? <a className="underline" href="/reset-password">Reset</a>
      </p>
    </main>
  );
}
