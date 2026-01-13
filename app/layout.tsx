// import "./globals.css";
// import Nav from "@/components/Nav";
// import AppHeader from "@/components/AppHeader";

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <div className="min-h-screen">
//           <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
//             <AppHeader />
//             <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
//               <Nav />
//               <main className="rounded-xl border bg-white p-6 shadow-sm">
//                 {children}
//               </main>
//             </div>
//           </div>
//         </div>
//       </body>
//     </html>
//   );
// }

// app/layout.tsx
import "./globals.css";

export const metadata = { title: "Avon Tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 p-0 overflow-x-hidden">{children}</body>
    </html>
  );
}
