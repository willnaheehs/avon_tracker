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


import AuthGate from "@/components/AuthGate";
import AppHeader from "@/components/AppHeader";
import Nav from "@/components/Nav";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex flex-col h-screen">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <Nav />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
