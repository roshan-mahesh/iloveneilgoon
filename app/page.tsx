"use client";

import { useEffect, useState, useCallback } from "react";

const HEART_COLORS = ["#dc2626", "#f87171", "#f9a8d4", "#fff5f5", "#fecaca"];

type Phase = "intro" | "transitioning" | "countdown";

// Target: Midnight Feb 14, 2026 (Valentine's Day)
const getTargetDate = () => new Date("2026-02-14T00:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const now = new Date();
      const target = getTargetDate();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startTransition = useCallback(() => {
    setPhase("transitioning");
    setTimeout(() => setPhase("countdown"), 1200);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fef2f2]">
      {/* Expanding hearts layer (cycle) — red, pink, white */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const delay = `${(i * 0.12) % 2}s`;
          return (
            <span
              key={i}
              className="absolute text-3xl xs:text-4xl sm:text-5xl md:text-6xl select-none"
              style={{
                left: `${15 + (i * 3.2) % 70}%`,
                top: `${10 + (i * 4) % 80}%`,
                color: HEART_COLORS[i % HEART_COLORS.length],
                animation: `heart-expand 3.5s ease-in-out ${delay} infinite`,
              }}
            >
              ♥
            </span>
          );
        })}
      </div>

      {/* Dramatic red flash overlay during transition */}
      {phase === "transitioning" && (
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-red-500 animate-[transition-flash_1.2s_ease-out_forwards]"
          aria-hidden
        />
      )}

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12">
        {/* ——— INTRO ——— */}
        {(phase === "intro" || phase === "transitioning") && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center px-4 transition-none ${
              phase === "transitioning"
                ? "animate-[intro-exit_0.8s_ease-in_forwards]"
                : ""
            }`}
          >
            <div className="flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8 text-center">
              {/* Readable card behind intro text */}
              <div className="rounded-3xl bg-white/95 px-6 py-8 sm:px-10 sm:py-12 shadow-xl ring-2 ring-red-200/60 backdrop-blur-sm">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-900 mb-4 sm:mb-6 tracking-tight drop-shadow-sm">
                  Hey Neilll 💕
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-red-800 leading-relaxed font-medium max-w-xl mx-auto">
                  We&apos;re glad you&apos;re starting to find us.
                </p>
              </div>

              {phase === "intro" && (
                <button
                  type="button"
                  onClick={startTransition}
                  className="mt-4 rounded-2xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-red-500/40 transition hover:bg-red-700 hover:shadow-red-500/50 active:scale-[0.98] animate-[text-reveal_0.6s_ease-out_0.4s_both]"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ——— COUNTDOWN (after transition) ——— */}
        {phase === "countdown" && (
          <div className="flex w-full max-w-4xl flex-col items-center gap-6 sm:gap-8 text-center animate-[countdown-enter_0.8s_ease-out]">
            {/* Message — high contrast */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-900 drop-shadow-sm">
                Your first clue arrives at midnight.
              </h2>
              <p className="text-base sm:text-lg text-red-800 max-w-xl leading-relaxed px-2">
                When Valentine&apos;s Day begins — get ready, Neil 👀
              </p>
            </div>

            {/* Countdown timer — readable labels and numbers */}
            <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
              <p className="text-sm sm:text-base uppercase tracking-[0.25em] text-red-900/80 font-medium">
                Time until your clue unlocks
              </p>

              {mounted && timeLeft.total > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold tabular-nums text-red-800 drop-shadow-md animate-[countdown-pulse_2s_ease-in-out_infinite]">
                      {String(timeLeft.days).padStart(2, "0")}
                    </div>
                    <p className="text-sm font-medium text-red-900 uppercase tracking-wider">
                      Days
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold tabular-nums text-red-800 drop-shadow-md animate-[countdown-pulse_2s_ease-in-out_0.5s_infinite]">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </div>
                    <p className="text-sm font-medium text-red-900 uppercase tracking-wider">
                      Hours
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold tabular-nums text-red-800 drop-shadow-md animate-[countdown-pulse_2s_ease-in-out_1s_infinite]">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </div>
                    <p className="text-sm font-medium text-red-900 uppercase tracking-wider">
                      Minutes
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div
                      className={`text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold tabular-nums text-red-800 drop-shadow-md ${
                        timeLeft.seconds <= 10 && timeLeft.seconds > 0
                          ? "animate-[countdown-final_0.5s_ease-in-out_infinite]"
                          : "animate-[countdown-pulse_2s_ease-in-out_1.5s_infinite]"
                      }`}
                    >
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </div>
                    <p className="text-sm font-medium text-red-900 uppercase tracking-wider">
                      Seconds
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold text-red-800">
                  {mounted ? "00 : 00 : 00 : 00" : "Loading..."}
                </div>
              )}

              <p className="text-base sm:text-lg text-red-800 font-medium mt-2">
                ⏰ Midnight • February 14th, 2026
              </p>
            </div>

            <p className="text-sm sm:text-base text-red-700 mt-2">
              The wait is part of the mystery... or something like that 😉
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
