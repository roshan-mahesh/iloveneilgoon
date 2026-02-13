export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-900 via-black to-rose-950 text-white">
      {/* Floating hearts background  */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 13) % 100}%`,
              top: "100%",
              animation: "float-heart linear infinite",
              animationDuration: `${18 + (i % 5) * 3}s`,
              animationDelay: `${-i * 1.7}s`,
              opacity: 0.35 + (i % 3) * 0.1,
            }}
          >
            <span className="text-4xl sm:text-5xl text-rose-400/50 drop-shadow-[0_0_18px_rgba(244,114,182,0.45)]">
              ♥
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="max-w-3xl w-full">
          <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_18px_80px_rgba(0,0,0,0.7)] px-8 py-10 sm:px-12 sm:py-14">
            <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80 mb-3">
              VALENTINE&apos;S DAY • 2026
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-6">
              Love, but make it&nbsp;
              <span className="inline-block bg-gradient-to-r from-rose-300 via-fuchsia-300 to-sky-200 bg-clip-text text-transparent">
                modern.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-200/90 leading-relaxed max-w-xl mb-8">
              A minimal Valentine&apos;s landing page with soft neon glow,
              drifting hearts, and copy that feels as intentional as the person
              you&apos;re sending it to.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <button className="inline-flex items-center justify-center rounded-full bg-white text-zinc-900 px-6 py-3 text-sm sm:text-base font-medium tracking-tight shadow-[0_10px_40px_rgba(255,255,255,0.35)] hover:shadow-[0_12px_48px_rgba(255,255,255,0.45)] hover:-translate-y-0.5 transition-all duration-200">
                Send a digital love note
              </button>
              <button className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm sm:text-base font-medium tracking-tight text-zinc-100/90 hover:bg-white/10 hover:border-white/60 transition-all duration-200">
                Preview the playlist
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-zinc-300/70">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live for the next 24 hours
              </span>
              <span className="text-zinc-400/80">
                Crafted with intention. Best viewed with someone in mind.
              </span>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes float-heart {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translate3d(-20px, -50vh, 0) scale(1.1);
          }
          100% {
            transform: translate3d(20px, -110vh, 0) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
