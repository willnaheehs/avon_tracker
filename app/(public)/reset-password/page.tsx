"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setUpdating(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Password updated. Redirecting…");
      setTimeout(() => router.replace("/login"), 800);
    }
  }

  // If user somehow loads this without a session from the email link:
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setMsg("Open this page from the password reset email link.");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded p-2" type="password"
               placeholder="New password" value={password}
               onChange={(e)=>setPassword(e.target.value)} required />
        {msg && <p className="text-sm">{msg}</p>}
        <button className="px-4 py-2 border rounded" disabled={updating}>
          {updating ? "Updating..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
