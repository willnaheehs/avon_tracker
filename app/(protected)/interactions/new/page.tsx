"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import ProtectedLoading from "@/components/ProtectedLoading";

type CaseloadRow = {
  client_name: string | null;
  client_user_id: string;
  organization_id: string | null;
  organization_name: string | null;
};

type ClientThread = {
  id: string;
  subject: string | null;
  status: string;
};

export default function NewInteractionPage() {
  const { loading, profile } = useProfile();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [caseload, setCaseload] = useState<CaseloadRow[]>([]);
  const [threads, setThreads] = useState<ClientThread[]>([]);
  const [clientId, setClientId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function loadProviderData() {
      const { data, error } = await supabase
        .from("my_caseload")
        .select("client_name, client_user_id, organization_id, organization_name")
        .order("created_at", { ascending: false });

      if (error) {
        setErr(error.message);
        return;
      }

      setCaseload((data ?? []) as CaseloadRow[]);
    }

    async function loadClientThreads() {
      if (!profile) return;

      const { data, error } = await supabase
        .from("note_threads")
        .select("id, subject, status")
        .eq("client_user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (error) {
        setErr(error.message);
        return;
      }

      const rows = (data ?? []) as ClientThread[];
      setThreads(rows);
      if (rows.length === 1) {
        setThreadId(rows[0].id);
      }
    }

    if (profile?.role === "provider") {
      loadProviderData();
    }

    if (profile?.role === "client") {
      loadClientThreads();
    }
  }, [profile]);

  if (loading) return <ProtectedLoading message="Loading note composer and available threads." />;
  if (!profile) {
    return <main className="p-6">Account not registered.</main>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setErr("Please enter a note.");
      return;
    }

    setSaving(true);

    if (profile.role === "provider") {
      if (!clientId) {
        setSaving(false);
        setErr("Select a client.");
        return;
      }

      const selectedAssignment = caseload.find((row) => row.client_user_id === clientId);
      const { data: createdThreadId, error: threadError } = await supabase.rpc("create_note_thread", {
        p_client_user_id: clientId,
        p_organization_id: selectedAssignment?.organization_id ?? null,
        p_subject: subject.trim() || null,
      });

      if (threadError) {
        setSaving(false);
        setErr(threadError.message);
        return;
      }

      const { error: noteError } = await supabase.from("notes").insert({
        body: trimmedBody,
        thread_id: createdThreadId,
      });

      setSaving(false);

      if (noteError) {
        setErr(noteError.message);
        return;
      }

      router.push(`/players/${clientId}/interactions`);
      return;
    }

    if (!threadId) {
      setSaving(false);
      setErr("No client thread is available yet.");
      return;
    }

    const { error } = await supabase.from("notes").insert({
      body: trimmedBody,
      thread_id: threadId,
    });

    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(`/players/${profile.user_id}/interactions`);
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-8 shadow-[0_24px_70px_rgba(12,83,121,0.14)] backdrop-blur">
          <h1 className="text-4xl font-black tracking-tight text-[#16322a]">
            {profile.role === "provider" ? "Create a Client Note" : "Send a Note"}
          </h1>
          <p className="mt-3 text-base text-[#55776a]">
            {profile.role === "provider"
              ? "Start or continue a thread with a client from your caseload."
              : "Send a quick update or reply back into your thread."}
          </p>
        </section>

        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {err}
          </div>
        )}

        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
          <form onSubmit={submit} className="space-y-5">
            {profile.role === "provider" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#335b6d]">Client</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 text-[#16322a] focus:outline-none focus:ring-2 focus:ring-[#0f8df4]"
                  >
                    <option value="">Select client</option>
                    {caseload.map((row) => (
                      <option key={`${row.client_user_id}-${row.organization_id ?? "org"}`} value={row.client_user_id}>
                        {row.client_name ?? row.client_user_id}
                        {row.organization_name ? ` • ${row.organization_name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#335b6d]">Thread Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Rehab check-in"
                    className="w-full rounded-2xl border border-[#d7ebb2] bg-[#fcfff6] px-4 py-3 text-[#16322a] focus:outline-none focus:ring-2 focus:ring-[#69c931]"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#335b6d]">Thread</label>
                <select
                  value={threadId}
                  onChange={(e) => setThreadId(e.target.value)}
                  className="w-full rounded-2xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 text-[#16322a] focus:outline-none focus:ring-2 focus:ring-[#0f8df4]"
                >
                  <option value="">Select thread</option>
                  {threads.map((thread) => (
                    <option key={thread.id} value={thread.id}>
                      {thread.subject ?? "General Notes"} • {thread.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#335b6d]">Note</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your update, response, or follow-up note here"
                className="h-40 w-full resize-none rounded-2xl border border-[#b9dff4] bg-[#fbfeff] px-4 py-3 text-[#16322a] focus:outline-none focus:ring-2 focus:ring-[#0f8df4]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] px-6 py-3 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? "Sending..." : "Send Note"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
