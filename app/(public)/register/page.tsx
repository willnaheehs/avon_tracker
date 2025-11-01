"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, grad_year: gradYear === "" ? null : Number(gradYear) },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/interactions`
            : undefined,
      },
    });

    setSubmitting(false);
    if (error) return setMsg(error.message);

    // If confirmations ON: user created but no session yet
    if (data.user && !data.session) {
      setMsg("Check your email to confirm your account, then sign in.");
      return;
    }

    // If confirmations OFF: you're signed in now
    router.replace("/interactions");
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Full name"
               value={name} onChange={(e)=>setName(e.target.value)} required />
        <input className="w-full border rounded p-2" placeholder="Grad year (e.g. 2026)"
               value={gradYear} onChange={(e)=>setGradYear(e.target.value as any)} />
        <input className="w-full border rounded p-2" type="email" placeholder="Email"
               value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password"
               value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {msg && <p className="text-sm">{msg}</p>}
        <button className="px-4 py-2 border rounded" disabled={submitting}>
          {submitting ? "Creating..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm">
        Already have an account? <a className="underline" href="/login">Sign in</a>
      </p>
    </main>
  );
}
