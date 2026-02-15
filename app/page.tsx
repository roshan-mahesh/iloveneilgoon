"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const HEART_COLORS = ["#dc2626", "#f87171", "#f9a8d4", "#fff5f5", "#fecaca"];

type Phase = "intro" | "countdown" | "theme" | "reveal";

// ========== COUNTDOWN & UNLOCK TIMES (change these to test) ==========
// 1. getTargetDate: countdown target — next hint tonight at midnight (Feb 16th).
const getTargetDate = () => new Date("2026-02-16T00:00:00");

// 2. getSecondClueUnlockTime: when "Get next hint" appears on countdown page.
//    Beta: 8pm today. Production: midnight Feb 14 — use new Date("2026-02-14T00:00:00")
const getSecondClueUnlockTime = () => {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  return d;
};
// ======================================================================

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
  const [themeAnswer, setThemeAnswer] = useState("");
  const [themeError, setThemeError] = useState("");
  const [themeChecking, setThemeChecking] = useState(false);
  const [secondClueUnlocked, setSecondClueUnlocked] = useState(false);
  const [revealImageExpanded, setRevealImageExpanded] = useState(false);
  const [countdownExpandedImage, setCountdownExpandedImage] = useState<"clue1" | "clue2" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tick = () => {
      setTimeLeft(calculateTimeLeft());
      setSecondClueUnlocked(Date.now() >= getSecondClueUnlockTime().getTime());
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const showCountdown = useCallback(() => setPhase("countdown"), []);

  const submitTheme = useCallback(async () => {
    setThemeError("");
    setThemeChecking(true);
    try {
      const res = await fetch("/api/check-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: themeAnswer }),
      });
      const data = await res.json();
      if (data.correct) setPhase("reveal");
      else setThemeError("Not quite! What do all those words have in common?");
    } catch {
      setThemeError("Something went wrong");
    } finally {
      setThemeChecking(false);
    }
  }, [themeAnswer]);

  const hasTriggeredRevealConfetti = useRef(false);
  useEffect(() => {
    if (phase !== "reveal") return;
    if (typeof window === "undefined" || hasTriggeredRevealConfetti.current) return;
    hasTriggeredRevealConfetti.current = true;
    const t = setTimeout(async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#dc2626", "#f87171", "#f9a8d4", "#fecaca", "#fff5f5"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0.2 },
            colors: ["#dc2626", "#f9a8d4"],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 0.8 },
            colors: ["#dc2626", "#f9a8d4"],
          });
        }, 200);
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [phase]);

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
        {/* ——— LANDING (from e04b93a structure) ——— */}
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
                    Hope you liked the first 2 clues, Neil — ready for your third and final one?!?! 💕
                  </CardTitle>
                  <CardDescription className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-medium">
                    Your next hint drops at midnight. I hope you liked the puzzles as much as I like you.
                  </CardDescription>
                  <p className="text-lg sm:text-xl font-semibold text-primary">
                    Happy Valentine's Day, Neily pooo!
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

        {/* ——— COUNTDOWN PAGE: left = Hint 1 & 2 hearts, right = countdown card ——— */}
        {phase === "countdown" && (
          <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4 animate-[countdown-enter_0.8s_ease-out]">
            {/* Left: Hint 1 & Hint 2 in hearts — as big as the card, a bit smaller, stacked */}
            <div className="flex flex-col items-center justify-center gap-6 flex-1 w-full min-w-0 max-w-[420px] lg:max-w-[480px]">
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-base font-semibold uppercase tracking-[0.2em] text-foreground">
                  Hint 1
                </p>
                <button
                  type="button"
                  onClick={() => setCountdownExpandedImage("clue1")}
                  className="relative w-full aspect-square max-w-[420px] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-full mx-auto"
                  style={{
                    filter: "drop-shadow(0 0 28px rgba(220,38,38,0.25)) drop-shadow(0 24px 48px -12px rgba(185,28,28,0.4))",
                  }}
                  aria-label="Expand hint 1"
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
                    <defs>
                      <linearGradient id="heartFillCountdown1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="50%" stopColor="#fef2f2" />
                        <stop offset="100%" stopColor="#fecaca" />
                      </linearGradient>
                      <clipPath id="heartClipCountdown1" clipPathUnits="objectBoundingBox">
                        <path d="M 0.5 0.85 C 0.5 0.85 0.1 0.55 0.1 0.35 C 0.1 0.15 0.3 0.05 0.5 0.25 C 0.7 0.05 0.9 0.15 0.9 0.35 C 0.9 0.55 0.5 0.85 0.5 0.85 Z" />
                      </clipPath>
                    </defs>
                    <path d="M 50 85 C 50 85 10 55 10 35 C 10 15 30 5 50 25 C 70 5 90 15 90 35 C 90 55 50 85 50 85 Z" fill="url(#heartFillCountdown1)" stroke="#dc2626" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute inset-0 overflow-hidden bg-rose-50/50" style={{ clipPath: "url(#heartClipCountdown1)" }}>
                    <img src="/milk.png" alt="Hint 1" className="w-full h-full object-cover object-center" />
                  </div>
                </button>
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-base font-semibold uppercase tracking-[0.2em] text-foreground">
                  Hint 2
                </p>
                <button
                  type="button"
                  onClick={() => setCountdownExpandedImage("clue2")}
                  className="relative w-full aspect-square max-w-[420px] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-full mx-auto"
                  style={{
                    filter: "drop-shadow(0 0 28px rgba(220,38,38,0.25)) drop-shadow(0 24px 48px -12px rgba(185,28,28,0.4))",
                  }}
                  aria-label="Expand hint 2"
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
                    <defs>
                      <linearGradient id="heartFillCountdown2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="50%" stopColor="#fef2f2" />
                        <stop offset="100%" stopColor="#fecaca" />
                      </linearGradient>
                      <clipPath id="heartClipCountdown2" clipPathUnits="objectBoundingBox">
                        <path d="M 0.5 0.85 C 0.5 0.85 0.1 0.55 0.1 0.35 C 0.1 0.15 0.3 0.05 0.5 0.25 C 0.7 0.05 0.9 0.15 0.9 0.35 C 0.9 0.55 0.5 0.85 0.5 0.85 Z" />
                      </clipPath>
                    </defs>
                    <path d="M 50 85 C 50 85 10 55 10 35 C 10 15 30 5 50 25 C 70 5 90 15 90 35 C 90 55 50 85 50 85 Z" fill="url(#heartFillCountdown2)" stroke="#dc2626" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute inset-0 overflow-hidden bg-rose-50/50" style={{ clipPath: "url(#heartClipCountdown2)" }}>
                    <img src="/bee.png" alt="Hint 2" className="w-full h-full object-cover object-center origin-center" style={{ transform: "scale(0.88)", objectPosition: "35% 50%" }} />
                  </div>
                </button>
              </div>
            </div>

            {/* Right: countdown card (867cd94 style) */}
            <Card className="juicy-card flex-1 w-full max-w-3xl border-0 bg-white/90 backdrop-blur-md">
              <CardHeader className="space-y-2 pb-4 px-8 sm:px-10 pt-8 sm:pt-10">
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Your next clue arrives at midnight.
                </CardTitle>
                <CardDescription className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  When the clock strikes twelve — get ready, Neil 👀
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 sm:px-10 pb-8 sm:pb-10">
                <p className="text-sm sm:text-base uppercase tracking-[0.25em] text-muted-foreground font-medium">
                  Time until your clue unlocks
                </p>

                {mounted && timeLeft.total > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl mx-auto">
                    <div className="juicy-countdown-block flex flex-col items-center gap-1 sm:gap-2">
                      <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_infinite]">
                        {String(timeLeft.days).padStart(2, "0")}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Days</p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1 sm:gap-2">
                      <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_0.5s_infinite]">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Hours</p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1 sm:gap-2">
                      <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_1s_infinite]">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Min</p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1 sm:gap-2">
                      <div
                        className={`text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums text-foreground ${
                          timeLeft.seconds <= 10 && timeLeft.seconds > 0
                            ? "animate-[countdown-final_0.5s_ease-in-out_infinite]"
                            : "animate-[countdown-pulse_2s_ease-in-out_1.5s_infinite]"
                        }`}
                      >
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Sec</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold text-foreground tabular-nums">
                    {mounted ? "00 : 00 : 00 : 00" : "Loading..."}
                  </div>
                )}

                <p className="text-base sm:text-lg text-muted-foreground font-medium">
                  ⏰ Midnight • February 16th, 2026
                </p>

                {secondClueUnlocked && (
                  <Button
                    onClick={() => setPhase("theme")}
                    className="juicy-btn w-full sm:w-auto rounded-xl border-0 text-white font-semibold"
                  >
                    Get next hint →
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setPhase("intro")}
                  className="rounded-xl border-2 border-rose-300 font-semibold w-full sm:w-auto"
                >
                  ← Back
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Countdown: full-screen overlay when a hint heart is clicked */}
        {typeof document !== "undefined" &&
          phase === "countdown" &&
          countdownExpandedImage &&
          createPortal(
            <button
              type="button"
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => setCountdownExpandedImage(null)}
              onKeyDown={(e) => e.key === "Escape" && setCountdownExpandedImage(null)}
              aria-label="Close"
            >
              <img
                src={countdownExpandedImage === "clue1" ? "/milk.png" : "/bee.png"}
                alt={countdownExpandedImage === "clue1" ? "Hint 1 — full view" : "Hint 2 — full view"}
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain pointer-events-none select-none"
                draggable={false}
              />
            </button>,
            document.body
          )}

        {/* ——— THEME QUESTION ——— */}
        {phase === "theme" && (
          <div className="w-full max-w-md mx-auto px-4 animate-[countdown-enter_0.5s_ease-out]">
            <Card className="juicy-card border-0 bg-gradient-to-b from-white to-rose-50/60 backdrop-blur-md shadow-xl shadow-rose-900/10">
              <CardHeader className="text-center pb-4 pt-8 px-8">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  What was the common theme amongst all those words?
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  One word is enough, Neil honey 😉
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pb-10 px-8">
                <Input
                  value={themeAnswer}
                  onChange={(e) => {
                    setThemeAnswer(e.target.value);
                    setThemeError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submitTheme()}
                  placeholder="Your answer..."
                  className="h-12 rounded-xl text-lg border-2 border-rose-200/80 focus:border-primary"
                />
                <Button
                  onClick={submitTheme}
                  disabled={themeChecking}
                  className="juicy-btn w-full rounded-xl h-12 text-lg font-semibold text-white border-0 shadow-lg shadow-rose-900/25"
                >
                  {themeChecking ? "Checking…" : "Reveal my surprise →"}
                </Button>
                {themeError && <p className="text-center text-destructive text-sm font-medium">{themeError}</p>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ——— FINAL REVEAL (heart + bee) ——— */}
        {phase === "reveal" && (
          <div className="fixed inset-0 z-20 flex flex-col items-center justify-center min-h-screen overflow-y-auto bg-gradient-to-br from-[#fef2f2] via-[#fce7f3] to-[#fdf2f8]">
            {/* Expanding hearts background — same as landing */}
            <div
              className="pointer-events-none fixed inset-0 z-0"
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
            {/* Dramatic flash when entering reveal */}
            <div
              className="pointer-events-none fixed inset-0 z-[25] bg-gradient-to-br from-rose-500/80 via-pink-400/70 to-red-500/80 animate-[reveal-flash-strong_1.4s_ease-out_forwards]"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen py-12 px-6 gap-6">
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-red-900 shrink-0 animate-[text-reveal_0.6s_ease-out_0.5s_both] text-center [text-shadow:0_0_40px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.15),0_4px_12px_rgba(220,38,38,0.3)]">
                For you, Neil honey 💕
              </p>
              <button
                type="button"
                onClick={() => setRevealImageExpanded(true)}
                className="reveal-heart-with-pulse relative shrink-0 aspect-square cursor-pointer border-0 bg-transparent p-0 [filter:drop-shadow(0_0_64px_rgba(220,38,38,0.5))_drop-shadow(0_0_120px_rgba(249,168,212,0.35))_drop-shadow(0_32px_64px_-16px_rgba(185,28,28,0.5))] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                style={{
                  width: "min(88vw, 580px, 58vh)",
                  height: "min(88vw, 580px, 58vh)",
                }}
                title="Click to expand"
                aria-label="Expand image"
              >
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="heartFillReveal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fff" />
                      <stop offset="50%" stopColor="#fef2f2" />
                      <stop offset="100%" stopColor="#fecaca" />
                    </linearGradient>
                    <clipPath id="heartClipReveal" clipPathUnits="objectBoundingBox">
                      <path d="M 0.5 0.85 C 0.5 0.85 0.1 0.55 0.1 0.35 C 0.1 0.15 0.3 0.05 0.5 0.25 C 0.7 0.05 0.9 0.15 0.9 0.35 C 0.9 0.55 0.5 0.85 0.5 0.85 Z" />
                    </clipPath>
                  </defs>
                  <path
                    d="M 50 85 C 50 85 10 55 10 35 C 10 15 30 5 50 25 C 70 5 90 15 90 35 C 90 55 50 85 50 85 Z"
                    fill="url(#heartFillReveal)"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  className="absolute inset-0 overflow-hidden flex items-center justify-center bg-rose-50/50"
                  style={{ clipPath: "url(#heartClipReveal)" }}
                >
                  <img
                    src="/bee.png"
                    alt="Bee and honey"
                    className="w-full h-full object-cover origin-center"
                    style={{ transform: "scale(0.88)", objectPosition: "35% 50%" }}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </button>

              {/* Full-screen overlay: portal to body so it's on top; click anywhere to close */}
              {typeof document !== "undefined" &&
                revealImageExpanded &&
                createPortal(
                  <button
                    type="button"
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    onClick={() => setRevealImageExpanded(false)}
                    onKeyDown={(e) => e.key === "Escape" && setRevealImageExpanded(false)}
                    aria-label="Close expanded image (click or press Escape)"
                  >
                    <img
                      src="/bee.png"
                      alt="Bee and honey — full view"
                      className="max-w-full max-h-[90vh] w-auto h-auto object-contain pointer-events-none select-none"
                      draggable={false}
                    />
                  </button>,
                  document.body
                )}

              <p className="text-center max-w-md shrink-0 text-lg sm:text-xl md:text-2xl leading-relaxed font-semibold text-red-950 animate-[text-reveal_0.6s_ease-out_1.2s_both] [text-shadow:0_0_32px_rgba(255,255,255,0.85),0_1px_3px_rgba(0,0,0,0.12)]">
                You found all the bees — and you're the only one I'm buzzing for. Happy Valentine's, Neily bee. 💕
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
