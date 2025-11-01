// components/Nav.tsx
"use client";
import Link from "next/link";
import { useProfile } from "@/components/useProfile";

export default function Nav() {
  const { loading, profile } = useProfile();
  if (loading) return null;

  const isCoach = profile?.role === "coach";

  return (
    <aside className="space-y-2">
      <nav className="sticky top-4 p-3 border rounded bg-white">
        <ul className="space-y-2">
          {!isCoach && (
            <>
              <li><Link href="/interactions/new">Log Interaction</Link></li>
              <li><Link href="/interactions">My Logs</Link></li>
            </>
          )}
          {isCoach && <li><Link href="/interactions">All Logs</Link></li>}
        </ul>
      </nav>
    </aside>
  );
}
