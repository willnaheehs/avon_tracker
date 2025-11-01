// // app/layout.tsx  (SERVER component)
// import AuthGate from "@/components/AuthGate";
// import Nav from "@/components/Nav"; // <- client component now

// export default function AppLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <AuthGate>
//       <div className="grid md:grid-cols-[220px_1fr] gap-4">
//         <Nav />
//         <section>{children}</section>
//       </div>
//     </AuthGate>
//   );
// }


// app/(public)/layout.tsx  (SERVER)
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
