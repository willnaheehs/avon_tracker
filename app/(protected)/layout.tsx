// app/(protected)/layout.tsx  (SERVER)
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav"; // Nav is a client component

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        <Nav />
        <section>{children}</section>
      </div>
    </AuthGate>
  );
}
