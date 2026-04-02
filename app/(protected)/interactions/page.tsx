"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { useProfile } from "@/components/useProfile";
import ProtectedLoading from "@/components/ProtectedLoading";

type ThreadRow = {
  client_user_id: string;
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

type CaseloadRow = {
  client_name: string | null;
  client_user_id: string;
  organization_name: string | null;
};

export default function InteractionsPage() {
  const { loading, profile } = useProfile();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [latestNotes, setLatestNotes] = useState<Record<string, NoteRow | undefined>>({});
  const [caseload, setCaseload] = useState<Record<string, CaseloadRow>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProviderThreads() {
      const caseloadRes = await supabase
        .from("my_caseload")
        .select("client_name, client_user_id, organization_name");

      if (caseloadRes.error) {
        setError(caseloadRes.error.message);
        return;
      }

      const rows = (caseloadRes.data ?? []) as CaseloadRow[];
      const clientIds = rows.map((row) => row.client_user_id);
      const caseloadMap = rows.reduce<Record<string, CaseloadRow>>((acc, row) => {
        acc[row.client_user_id] = row;
        return acc;
      }, {});
      setCaseload(caseloadMap);

      if (clientIds.length === 0) {
        setThreads([]);
        setLatestNotes({});
        return;
      }

      const threadRes = await supabase
        .from("note_threads")
        .select("id, client_user_id, subject, status, created_at")
        .in("client_user_id", clientIds)
        .order("created_at", { ascending: false });

      if (threadRes.error) {
        setError(threadRes.error.message);
        return;
      }

      const threadRows = (threadRes.data ?? []) as ThreadRow[];
      setThreads(threadRows);
      await loadLatestNotes(threadRows.map((thread) => thread.id));
    }

    async function loadClientThreads() {
      if (!profile) return;

      const threadRes = await supabase
        .from("note_threads")
        .select("id, client_user_id, subject, status, created_at")
        .eq("client_user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (threadRes.error) {
        setError(threadRes.error.message);
        return;
      }

      const threadRows = (threadRes.data ?? []) as ThreadRow[];
      setThreads(threadRows);
      await loadLatestNotes(threadRows.map((thread) => thread.id));
    }

    async function loadLatestNotes(threadIds: string[]) {
      if (threadIds.length === 0) {
        setLatestNotes({});
        return;
      }

      const notesRes = await supabase
        .from("notes")
        .select("id, thread_id, body, created_at, author_user_id")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false });

      if (notesRes.error) {
        setError(notesRes.error.message);
        return;
      }

      const noteMap: Record<string, NoteRow | undefined> = {};
      ((notesRes.data ?? []) as NoteRow[]).forEach((note) => {
        if (!noteMap[note.thread_id]) {
          noteMap[note.thread_id] = note;
        }
      });

      setLatestNotes(noteMap);
    }

    async function load() {
      if (!profile) return;
      setError(null);

      if (profile.role === "provider") {
        await loadProviderThreads();
        return;
      }

      await loadClientThreads();
    }

    if (!loading) load();
  }, [loading, profile]);

  const heading = useMemo(() => {
    if (profile?.role === "provider") return "Threads";
    return "My Threads";
  }, [profile]);

  if (loading) return <ProtectedLoading message="Loading threads and the latest notes." />;
  if (!profile) {
    return <main className="p-6">You must be signed in to view threads.</main>;
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-white/82 p-8 shadow-[0_24px_70px_rgba(12,83,121,0.14)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-[#f4fbe8] px-4 py-2 text-xs font-black tracking-[0.18em] text-[#4d9b1c] uppercase">
                Conversation Center
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[#16322a]">{heading}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#55776a]">
                Review active note threads and jump back into client communication quickly.
              </p>
            </div>

            <Link
              href="/interactions/new"
              className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] px-6 py-3 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
            >
              New Note
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {threads.map((thread) => {
            const latest = latestNotes[thread.id];
            const client = caseload[thread.client_user_id];
            const title =
              profile.role === "provider" ? client?.client_name ?? "Unnamed client" : thread.subject ?? "General Notes";
            const subtitle =
              profile.role === "provider"
                ? client?.organization_name ?? "Unknown organization"
                : thread.status;

            return (
              <Link
                key={thread.id}
                href={
                  profile.role === "provider"
                    ? `/players/${thread.client_user_id}/interactions`
                    : `/players/${profile.user_id}/interactions`
                }
                className="block rounded-[1.75rem] border border-white/80 bg-white/82 p-6 shadow-[0_20px_60px_rgba(12,83,121,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(12,83,121,0.15)] backdrop-blur"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-black text-[#16322a]">{title}</div>
                    <div className="mt-1 text-sm text-[#55776a]">{subtitle}</div>
                  </div>
                  <span className="rounded-full bg-[#eef9ff] px-3 py-1 text-xs font-black tracking-[0.14em] text-[#0a7bdc]">
                    {thread.status}
                  </span>
                </div>

                <div className="rounded-2xl border border-[#d6eefc] bg-[linear-gradient(135deg,_#fafdff,_#f5fbeb)] p-4">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#4d9b1c]">Latest note</div>
                  <div className="whitespace-pre-wrap text-[#24483d]">
                    {latest?.body ?? "No notes have been sent in this thread yet."}
                  </div>
                  {latest?.created_at && (
                    <div className="mt-3 text-xs text-[#55776a]">
                      {new Date(latest.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {threads.length === 0 && (
            <div className="col-span-full rounded-[2rem] border border-white/80 bg-white/82 p-12 text-center shadow-[0_24px_70px_rgba(12,83,121,0.12)] backdrop-blur">
              <p className="mb-3 text-lg font-bold text-[#24483d]">No threads yet.</p>
              <p className="text-sm text-[#55776a]">Create the first note to start the conversation.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
