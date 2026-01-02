// // app/(protected)/layout.tsx
// import AuthGate from "@/components/AuthGate";
// import AppHeader from "@/components/AppHeader";
// import Nav from "@/components/Nav";

// export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <AuthGate>
//       <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
//         <AppHeader />

//         <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
//           <Nav />
//           <main className="rounded-xl border bg-white p-6 shadow-sm">{children}</main>
//         </div>
//       </div>
//     </AuthGate>
//   );
// }


// app/(protected)/layout.tsx
import AuthGate from "@/components/AuthGate";
import AppHeader from "@/components/AppHeader";
import Nav from "@/components/Nav";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="rounded-lg border bg-yellow-50 p-2 text-sm">
          PROTECTED LAYOUT ACTIVE
        </div>
      </div>

      <AuthGate>
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <AppHeader />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
            <Nav />
            <main className="rounded-xl border bg-white p-6 shadow-sm">{children}</main>
          </div>
        </div>
      </AuthGate>
    </>
  );
}
