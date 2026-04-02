"use client";

type ProtectedLoadingProps = {
  message?: string;
};

export default function ProtectedLoading({
  message = "Loading your CarePath workspace...",
}: ProtectedLoadingProps) {
  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(14,145,255,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(105,201,49,0.18),_transparent_24%),linear-gradient(150deg,_#eef9ff_0%,_#e8f9f0_52%,_#fefbea_100%)]">
      <header className="border-b border-white/60 bg-[linear-gradient(90deg,_rgba(7,65,102,0.95),_rgba(10,123,220,0.92)_38%,_rgba(77,155,28,0.88)_100%)] shadow-[0_14px_45px_rgba(9,66,97,0.18)] backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-4 lg:px-8">
          <div className="rounded-2xl border border-white/30 bg-white/12 px-3 py-2 backdrop-blur">
            <img src="/CarePath.png" alt="CarePath logo" className="h-10 w-auto object-contain sm:h-12" />
          </div>
          <div>
            <div className="text-lg font-black tracking-[0.18em] text-white sm:text-xl">CAREPATH</div>
            <div className="text-xs text-white/80 sm:text-sm">Preparing your dashboard</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 border-r border-white/60 bg-[linear-gradient(180deg,_rgba(244,251,255,0.96),_rgba(236,250,243,0.88))] p-6 md:block">
          <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#b9dff4]" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#d6eefc]" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-[#dff3ca]" />
          </div>
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-2xl border border-white/70 bg-white/70"
              />
            ))}
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-3xl rounded-[2rem] border border-white/80 bg-white/82 p-10 text-center shadow-[0_24px_70px_rgba(12,83,121,0.14)] backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#0f8df4,_#69c931)] shadow-lg">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-white/40 border-t-white" />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-[#16322a]">Opening CarePath</h1>
            <p className="mt-3 text-base leading-7 text-[#55776a]">{message}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
