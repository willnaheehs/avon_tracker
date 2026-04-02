import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,145,255,0.32),_transparent_34%),radial-gradient(circle_at_80%_24%,_rgba(105,201,49,0.28),_transparent_28%),linear-gradient(135deg,_#ecf8ff_0%,_#d8f6ee_42%,_#f8fbef_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
        <section className="text-center lg:text-left">
          <div className="inline-flex items-center rounded-full border border-[#8fd7ff] bg-white/70 px-4 py-2 text-sm font-semibold text-[#0a7bdc] shadow-sm backdrop-blur">
            Provider and client coordination, in one place
          </div>

          <div className="mt-8 flex justify-center lg:justify-start">
            <div className="rounded-[2.5rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,252,246,0.88))] p-6 shadow-[0_30px_90px_rgba(16,103,58,0.18)] backdrop-blur">
              <img
                src="/CarePath.png"
                alt="CarePath logo"
                className="w-[26rem] max-w-full object-contain sm:w-[32rem] lg:w-[40rem]"
              />
            </div>
          </div>

          <h1 className="mt-8 text-5xl font-black tracking-tight text-[#16322a] sm:text-6xl">
            CarePath
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#315447] lg:text-xl">
            A calmer way for providers and clients to share updates, manage caseloads, and keep care
            conversations moving.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-[#406657] lg:justify-start">
            <span className="rounded-full bg-white/75 px-4 py-2 shadow-sm">Secure note threads</span>
            <span className="rounded-full bg-white/75 px-4 py-2 shadow-sm">Organization invite codes</span>
            <span className="rounded-full bg-white/75 px-4 py-2 shadow-sm">Provider caseload views</span>
          </div>
        </section>

        <div className="mt-10 lg:mt-0">
          <div className="w-full rounded-[2rem] border border-white/80 bg-white/88 p-8 shadow-[0_25px_70px_rgba(11,88,131,0.18)] backdrop-blur">
            <h2 className="text-3xl font-black text-[#16322a]">Care Team Portal</h2>
            <p className="mt-3 text-base leading-7 text-[#55776a]">
              Built for physiotherapists, athletic trainers, and the clients who need a simple path back
              to the right provider.
            </p>

            <div className="mt-8 space-y-4">
              <Link
                href="/login"
                className="block w-full rounded-2xl bg-[linear-gradient(135deg,_#0f8df4,_#0b6fd6)] px-6 py-4 text-center text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block w-full rounded-2xl border-2 border-[#69c931] bg-[linear-gradient(135deg,_rgba(241,255,233,0.96),_rgba(255,248,208,0.92))] px-6 py-4 text-center text-base font-bold text-[#21452f] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Create Account
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-[#55776a] sm:grid-cols-2">
              <div className="rounded-2xl bg-[#eef9ff] p-4">
                <div className="font-bold text-[#0a7bdc]">For providers</div>
                <div className="mt-1">Create organizations, invite clients, and manage note threads.</div>
              </div>
              <div className="rounded-2xl bg-[#f4fbe8] p-4">
                <div className="font-bold text-[#4d9b1c]">For clients</div>
                <div className="mt-1">Share updates, review responses, and stay connected to care.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
