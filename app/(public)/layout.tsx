// app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <main className="rounded-xl border bg-white p-6 shadow-sm">{children}</main>
    </div>
  );
}
