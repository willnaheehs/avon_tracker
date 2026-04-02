"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/components/useProfile";

export default function Nav() {
  const { loading, profile } = useProfile();
  const pathname = usePathname();

  if (loading) {
    return (
      <aside className="w-72 border-r border-white/60 bg-[linear-gradient(180deg,_rgba(244,251,255,0.96),_rgba(236,250,243,0.88))] backdrop-blur">
        <nav className="space-y-5 p-6">
          <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#b9dff4]" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#d6eefc]" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-[#dff3ca]" />
          </div>

          <div className="space-y-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-2xl border border-white/70 bg-white/70"
              />
            ))}
          </div>
        </nav>
      </aside>
    );
  }

  const isProvider = profile?.role === "provider";

  function linkClasses(active: boolean) {
    return active
      ? "bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] text-white shadow-lg"
      : "bg-white/70 text-[#335b6d] hover:bg-white hover:text-[#16322a]";
  }

  return (
    <aside className="w-72 border-r border-white/60 bg-[linear-gradient(180deg,_rgba(244,251,255,0.96),_rgba(236,250,243,0.88))] backdrop-blur">
      <nav className="p-6 space-y-5">
        <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
          <div className="text-xs font-black tracking-[0.2em] text-[#0a7bdc] uppercase">Navigation</div>
          <div className="mt-2 text-sm text-[#55776a]">
            {isProvider ? "Manage organizations, caseload, and notes." : "Review your threads and send updates."}
          </div>
        </div>

        <ul className="space-y-2">
          {isProvider ? (
            <>
              <li>
                <Link className={`block rounded-2xl px-4 py-3 font-bold transition-all ${linkClasses(pathname === "/team")}`} href="/team">
                  Organizations
                </Link>
              </li>
              <li>
                <Link className={`block rounded-2xl px-4 py-3 font-bold transition-all ${linkClasses(pathname === "/players")}`} href="/players">
                  Caseload
                </Link>
              </li>
              <li>
                <Link className={`block rounded-2xl px-4 py-3 font-bold transition-all ${linkClasses(pathname === "/interactions")}`} href="/interactions">
                  Threads
                </Link>
              </li>
              <li>
                <Link className={`block rounded-2xl px-4 py-3 font-bold transition-all ${linkClasses(pathname === "/interactions/new")}`} href="/interactions/new">
                  New Note
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link className={`block rounded-2xl px-4 py-3 font-bold transition-all ${linkClasses(pathname === "/interactions")}`} href="/interactions">
                  My Threads
                </Link>
              </li>
              <li>
                <Link className={`block rounded-2xl px-4 py-3 font-bold transition-all ${linkClasses(pathname === "/interactions/new")}`} href="/interactions/new">
                  Send Note
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
