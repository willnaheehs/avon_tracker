"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      const isSignedIn = !!data.session;
      setSignedIn(isSignedIn);
      setReady(true);
      if (!isSignedIn) router.replace("/login"); // <-- send to public login
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ready || !signedIn) return null;
  return <>{children}</>;
}
