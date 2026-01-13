"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/components/useProfile";

export default function Nav() {
  const { loading, profile } = useProfile();
  const pathname = usePathname();

  if (loading) return null;

  const isCoach = profile?.role === "coach";

  return (
    <aside className="w-64 bg-white">
      <nav className="p-6 space-y-3">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4">Navigation</div>
        <ul className="space-y-2">
          {isCoach ? (
            <>
              <li>
                <Link
                  className={`block px-4 py-3 font-bold rounded-lg transition-all ${
                    pathname === "/team" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                  }`}
                  href="/team"
                >
                  Team
                </Link>
              </li>
              <li>
                <Link
                  className={`block px-4 py-3 font-bold rounded-lg transition-all ${
                    pathname === "/interactions" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                  }`}
                  href="/interactions"
                >
                  All Logs
                </Link>
              </li>
              <li>
                <Link
                  className={`block px-4 py-3 font-bold rounded-lg transition-all ${
                    pathname === "/interactions/new" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                  }`}
                  href="/interactions/new"
                >
                  Log Interaction
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  className={`block px-4 py-3 font-bold rounded-lg transition-all ${
                    pathname === "/interactions" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                  }`}
                  href="/interactions"
                >
                  My Logs
                </Link>
              </li>
              <li>
                <Link
                  className={`block px-4 py-3 font-bold rounded-lg transition-all ${
                    pathname === "/interactions/new" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                  }`}
                  href="/interactions/new"
                >
                  Log Interaction
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
