"use client";
import Link from "next/link";
import { useProfile } from "@/components/useProfile";

export default function Nav() {
  const { loading, profile } = useProfile();
  if (loading) return null;

  const isCoach = profile?.role === "coach";

  return (
    <aside>
      <nav className="sticky top-6 space-y-2 rounded-xl border bg-white p-3 shadow-sm">
        <div className="px-2 pb-2 text-xs font-medium text-slate-500">Menu</div>
        <ul className="space-y-1 text-sm">
          {isCoach ? (
            <>
              <li><Link className="block rounded-lg px-2 py-2 hover:bg-slate-50" href="/team">Team</Link></li>
              <li><Link className="block rounded-lg px-2 py-2 hover:bg-slate-50" href="/interactions">All Logs</Link></li>
              <li><Link className="block rounded-lg px-2 py-2 hover:bg-slate-50" href="/interactions/new">Log Interaction</Link></li>
            </>
          ) : (
            <>
              <li><Link className="block rounded-lg px-2 py-2 hover:bg-slate-50" href="/interactions">My Logs</Link></li>
              <li><Link className="block rounded-lg px-2 py-2 hover:bg-slate-50" href="/interactions/new">Log Interaction</Link></li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
