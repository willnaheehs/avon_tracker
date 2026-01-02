// app/(public)/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Avon Tracker</h1>
      <p className="text-sm text-slate-600">
        Track recruiting communications between athletes and coaches.
      </p>

      <div className="grid grid-cols-1 gap-2">
        <Link className="rounded-lg bg-black px-4 py-2 text-white" href="/login">
          Log in
        </Link>
        <Link className="rounded-lg border px-4 py-2" href="/register">
          Register
        </Link>
      </div>
    </div>
  );
}
