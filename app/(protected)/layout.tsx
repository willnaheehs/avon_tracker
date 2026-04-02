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
      <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(14,145,255,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(105,201,49,0.18),_transparent_24%),linear-gradient(150deg,_#eef9ff_0%,_#e8f9f0_52%,_#fefbea_100%)]">
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
