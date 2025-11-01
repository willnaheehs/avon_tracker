import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-4xl font-bold mb-2">Lacrosse Recruiting CRM (MVP)</h1>
      <p className="mb-6">A simple starting point for tracking players, colleges, and interactions.</p>
      <ul className="list-disc ml-6 space-y-2">
        <li><Link href="/players">Players</Link></li>
        <li><Link href="/colleges">Colleges</Link></li>
        <li><Link href="/interactions/new">Log Interaction</Link></li>
      </ul>
      <div className="mt-8">
        <Link href="/login" className="inline-block px-4 py-2 border rounded">
          Sign in
        </Link>
      </div>
    </main>
  );
}
