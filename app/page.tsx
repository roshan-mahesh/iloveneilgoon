"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HEART_COLORS = ["#dc2626", "#f87171", "#f9a8d4", "#fff5f5", "#fecaca"];

type Phase = "intro" | "countdown";

// Target: Midnight Feb 14, 2026 (Valentine's Day)
// Midnight before Feb 15th (start of Feb 15, 2026)
const getTargetDate = () => new Date("2026-02-15T00:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

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

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted after hydration to avoid SSR mismatch
    // This is a legitimate pattern for Next.js hydration safety
    // eslint-disable-next-line -- Intentional setState for hydration safety
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showCountdown = useCallback(() => {
    setPhase("countdown");
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fef2f2] via-[#fce7f3] to-[#fdf2f8]">
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

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12">
        {/* ——— LANDING ——— */}
        {phase === "intro" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div
              className={`flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8 text-center transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            >
              <Card className="juicy-card w-full max-w-2xl border-0 bg-white/90 backdrop-blur-md animate-[text-reveal_0.6s_ease-out_0.3s_both]">
                <CardHeader className="text-center space-y-4 pb-2 px-8 sm:px-10 pt-8 sm:pt-10">
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight drop-shadow-sm">
                    Neil, I hope you liked the first clue. Are you ready for the second clue? 💕
                  </CardTitle>
                  <CardDescription className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-medium">
                    I hope you liked the puzzle as much as I like you.
                  </CardDescription>
                  <p className="text-lg sm:text-xl font-semibold text-primary">
                    Happy Valentine's Day Neily pooo!
                  </p>
                </CardHeader>
                <CardContent className="flex justify-center pt-2 pb-8 sm:pb-10">
                  <Button
                    size="lg"
                    onClick={showCountdown}
                    className="juicy-btn rounded-2xl px-10 py-6 text-lg font-semibold text-white border-0 animate-[text-reveal_0.6s_ease-out_0.4s_both]"
                  >
                    See countdown →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ——— COUNTDOWN: left = heart + Clue 1, right = countdown to tomorrow midnight ——— */}
        {phase === "countdown" && (
          <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4 animate-[countdown-enter_0.8s_ease-out]">
            {/* Left: heart with milk + Clue 1 */}
            <div className="flex flex-col items-center gap-4 flex-1 w-full max-w-md">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                Clue 1
              </p>
              <div
                className="relative w-full max-w-[320px] aspect-square"
                style={{
                  filter: "drop-shadow(0 0 24px rgba(220,38,38,0.2)) drop-shadow(0 20px 40px -12px rgba(185,28,28,0.35))",
                }}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="heartFillCountdown" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fff" />
                      <stop offset="50%" stopColor="#fef2f2" />
                      <stop offset="100%" stopColor="#fecaca" />
                    </linearGradient>
                    <filter id="heartGlowCountdown">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#dc2626" floodOpacity="0.2" />
                    </filter>
                    <clipPath id="heartClipCountdown" clipPathUnits="objectBoundingBox">
                      <path d="M 0.5 0.85 C 0.5 0.85 0.1 0.55 0.1 0.35 C 0.1 0.15 0.3 0.05 0.5 0.25 C 0.7 0.05 0.9 0.15 0.9 0.35 C 0.9 0.55 0.5 0.85 0.5 0.85 Z" />
                    </clipPath>
                  </defs>
                  <path
                    d="M 50 85 C 50 85 10 55 10 35 C 10 15 30 5 50 25 C 70 5 90 15 90 35 C 90 55 50 85 50 85 Z"
                    fill="url(#heartFillCountdown)"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    filter="url(#heartGlowCountdown)"
                  />
                </svg>
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: "url(#heartClipCountdown)" }}
                >
                  <img
                    src="/milk.png"
                    alt="Clue 1"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>

            {/* Right: countdown to tomorrow midnight */}
            <Card className="juicy-card flex-1 w-full max-w-md border-0 bg-white/90 backdrop-blur-md">
              <CardHeader className="space-y-2 pb-4 px-6 sm:px-8 pt-6 sm:pt-8">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  Come back neily bug!!
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground">
                  Next clue at midnight • February 15th
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 sm:px-8 pb-6 sm:pb-8">
                {mounted && timeLeft.total > 0 ? (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    <div className="juicy-countdown-block flex flex-col items-center gap-1">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_infinite]">
                        {String(timeLeft.days).padStart(2, "0")}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Days</p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_0.5s_infinite]">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_1s_infinite]">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min</p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1">
                      <div
                        className={`text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-foreground ${
                          timeLeft.seconds <= 10 && timeLeft.seconds > 0
                            ? "animate-[countdown-final_0.5s_ease-in-out_infinite]"
                            : "animate-[countdown-pulse_2s_ease-in-out_1.5s_infinite]"
                        }`}
                      >
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sec</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                    {mounted ? "00 : 00 : 00 : 00" : "Loading..."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
