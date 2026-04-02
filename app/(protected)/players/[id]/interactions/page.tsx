"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import ProtectedLoading from "@/components/ProtectedLoading";

type ClientInfo = {
  name: string | null;
  user_id: string;
};

type ThreadRow = {
  created_at: string;
  id: string;
  status: string;
  subject: string | null;
};

type NoteRow = {
  author_user_id: string;
  body: string;
  created_at: string;
  id: string;
  thread_id: string;
};

export default function PlayerInteractionsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { loading, profile } = useProfile();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [notes, setNotes] = useState<Record<string, NoteRow[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile || !clientId) return;
      setError(null);

      const clientRes = await supabase
        .from("profiles")
        .select("user_id, name")
        .eq("user_id", clientId)
        .maybeSingle();

      if (clientRes.error) {
        setError(clientRes.error.message);
        return;
      }

      setClient((clientRes.data as ClientInfo | null) ?? null);

      const threadRes = await supabase
        .from("note_threads")
        .select("id, subject, status, created_at")
        .eq("client_user_id", clientId)
        .order("created_at", { ascending: false });

      if (threadRes.error) {
        setError(threadRes.error.message);
        return;
      }

      const threadRows = (threadRes.data ?? []) as ThreadRow[];
      setThreads(threadRows);

      const threadIds = threadRows.map((thread) => thread.id);
      if (threadIds.length === 0) {
        setNotes({});
        return;
      }

      const notesRes = await supabase
        .from("notes")
        .select("id, thread_id, body, created_at, author_user_id")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true });

      if (notesRes.error) {
        setError(notesRes.error.message);
        return;
      }

      const grouped = ((notesRes.data ?? []) as NoteRow[]).reduce<Record<string, NoteRow[]>>((acc, note) => {
        if (!acc[note.thread_id]) acc[note.thread_id] = [];
        acc[note.thread_id].push(note);
        return acc;
      }, {});

      setNotes(grouped);
    }

    if (!loading) load();
  }, [loading, profile, clientId]);

  const isProvider = useMemo(() => profile?.role === "provider", [profile]);

  async function deleteNote(id: string, threadId: string) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    setNotes((prev) => ({
      ...prev,
      [threadId]: (prev[threadId] ?? []).filter((note) => note.id !== id),
    }));
  }

  if (loading) return <ProtectedLoading message="Loading note history and thread details." />;
  if (!profile) {
    return <main className="p-6">You must be signed in to view note history.</main>;
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-8 shadow-[0_24px_70px_rgba(12,83,121,0.14)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#16322a]">
                {isProvider ? `${client?.name ?? "Client"} Notes` : "My Notes"}
              </h1>
              <div className="mt-3 text-sm text-[#55776a]">
                {threads.length} {threads.length === 1 ? "thread" : "threads"}
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/interactions"
                className="rounded-2xl border border-[#b9dff4] bg-white/80 px-6 py-3 font-bold text-[#0b6fd6] transition-all hover:-translate-y-0.5"
              >
                Back to Threads
              </Link>
              <Link
                href="/interactions/new"
                className="rounded-2xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] px-6 py-3 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
              >
                New Note
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {threads.map((thread) => (
            <section
              key={thread.id}
              className="rounded-[1.75rem] border border-white/80 bg-white/82 p-6 shadow-[0_20px_60px_rgba(12,83,121,0.12)] backdrop-blur"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#16322a]">{thread.subject ?? "General Notes"}</h2>
                  <div className="mt-1 text-sm text-[#55776a]">
                    {thread.status} • started {new Date(thread.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="rounded-full bg-[#f4fbe8] px-3 py-1 text-xs font-black tracking-[0.14em] text-[#4d9b1c]">
                  {thread.status}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {(notes[thread.id] ?? []).map((note) => {
                  const authoredByMe = note.author_user_id === profile.user_id;
                  return (
                    <div
                      key={note.id}
                      className={`rounded-2xl border p-4 ${
                        authoredByMe
                          ? "border-[#b9dff4] bg-[#eef9ff]"
                          : "border-[#d7ebb2] bg-[#fcfff6]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-bold text-[#24483d]">
                            {authoredByMe ? "You" : "Other participant"}
                          </div>
                          <div className="mt-1 text-xs text-[#55776a]">
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>

                        {authoredByMe && (
                          <div className="flex items-center gap-3 text-sm">
                            <Link href={`/interactions/${note.id}/edit`} className="font-bold text-[#0b6fd6] underline">
                              Edit
                            </Link>
                            <button
                              onClick={() => deleteNote(note.id, thread.id)}
                              className="font-bold text-red-600 underline"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 whitespace-pre-wrap text-[#24483d]">{note.body}</div>
                    </div>
                  );
                })}

                {(notes[thread.id] ?? []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#b9dff4] bg-[#fbfeff] p-4 text-[#55776a]">
                    No notes yet in this thread.
                  </div>
                )}
              </div>
            </section>
          ))}

          {threads.length === 0 && (
            <div className="rounded-[2rem] border border-white/80 bg-white/82 p-12 text-center shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
              <p className="mb-3 text-lg font-bold text-[#24483d]">No threads yet.</p>
              <p className="text-sm text-[#55776a]">Send a note to start the conversation.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
