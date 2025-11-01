"use client";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";

type Player = { id: string; first_name: string; last_name: string };
type College = { id: string; name: string };

export default function InteractionForm() {
  const { loading, profile } = useProfile();

  const [players, setPlayers] = useState<Player[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [type, setType] = useState("prospect_day");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Load colleges for coaches (players can't see colleges list, but can still insert if they know an ID or you add a small lookup)
  useEffect(() => {
    if (loading) return;

    async function load() {
      setError(null);

      // If coach, load players/colleges lists
      if (profile?.role === "coach") {
        const [pRes, cRes] = await Promise.all([
          supabase.from("players").select("id, first_name, last_name").order("last_name"),
          supabase.from("colleges").select("id, name").order("name"),
        ]);
        if (pRes.error) setError(pRes.error.message);
        else setPlayers(pRes.data ?? []);
        if (cRes.error) setError(cRes.error.message);
        else setColleges(cRes.data ?? []);
      }

      // If player, lock their player_id
      if (profile?.role === "player" && profile.player_id) {
        setPlayerId(profile.player_id);
      }
    }
    load();
  }, [loading, profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const payload = {
      player_id: playerId,
      college_id: collegeId,
      type,
      occurred_at: new Date(occurredAt).toISOString(),
      summary: summary || null,
      notes: notes || null,
    };

    const { error } = await supabase.from("interactions").insert(payload);
    if (error) setError(error.message);
    else {
      setOk(true);
      setSummary(""); setNotes("");
    }
  }

  if (loading) return null;

  const isCoach = profile?.role === "coach";
  const isPlayer = profile?.role === "player";

  return (
    <form onSubmit={submit} className="max-w-md mx-auto space-y-3 bg-white border p-4 rounded">
      <h1 className="text-lg font-semibold">Add Update</h1>

      {/* Player select: coaches choose; players hidden and locked */}
      {isCoach ? (
        <>
          <label className="block text-sm">Player</label>
          <select required className="w-full border p-2 rounded" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Select player</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-sm text-neutral-600">Logging for your profile.</p>
      )}

      {/* College select (coaches see list). For players, you can (a) allow a free-text college name you later reconcile, or (b) show a limited dropdown you control. */}
      <label className="block text-sm">College</label>
      <select required className="w-full border p-2 rounded" value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
        <option value="">Select college</option>
        {colleges.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label className="block text-sm">Type</label>
      <select className="w-full border p-2 rounded" value={type} onChange={(e) => setType(e.target.value)}>
        {["call","email","text","dm","visit","unofficial","official","prospect_day","camp","offer","commit","portal","other"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <label className="block text-sm">When</label>
      <input className="w-full border p-2 rounded" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />

      <input className="w-full border p-2 rounded" placeholder="Summary (optional)" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <textarea className="w-full border p-2 rounded" rows={4} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <button className="w-full bg-black text-white py-2 rounded" disabled={!collegeId || (!playerId && isCoach)}>Save</button>

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
      {ok && <p className="text-green-700 text-sm">Saved.</p>}
    </form>
  );
}
