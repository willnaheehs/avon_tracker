"use client";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type College = { id: string; name: string; division: string | null };

export default function CollegesPage() {
  const { loading, profile } = useProfile();
  const [colleges, setColleges] = useState<College[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (profile?.role !== "coach") return;
    (async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("id, name, division")
        .order("name", { ascending: true });
      if (error) setError(error.message);
      else setColleges(data ?? []);
    })();
  }, [loading, profile]);

  if (loading) return null;
  if (profile?.role !== "coach") return <p>You don’t have permission to view this page.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Colleges</h1>
      <ul className="divide-y bg-white border rounded">
        {colleges.map((c) => (
          <li key={c.id} className="p-3 flex justify-between">
            <span>{c.name}</span>
            <span className="text-sm text-neutral-500">{c.division ?? ""}</span>
          </li>
        ))}
      </ul>
      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
    </div>
  );
}
