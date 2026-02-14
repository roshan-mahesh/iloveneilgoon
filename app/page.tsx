"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const HEART_COLORS = ["#dc2626", "#f87171", "#f9a8d4", "#fff5f5", "#fecaca"];

type Phase = "intro" | "transitioning" | "countdown" | "puzzle" | "reveal";

// Target: Midnight Feb 14, 2026 (Valentine's Day)
// Midnight Valentine's Day (Feb 14, 2026)
const getTargetDate = () => new Date("2026-02-14T00:00:00");

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
  const [puzzleInput, setPuzzleInput] = useState("");
  const [puzzleError, setPuzzleError] = useState("");
  const [puzzleChecking, setPuzzleChecking] = useState(false);
  const [revealStage, setRevealStage] = useState<"dramatic" | "clue">("dramatic");

  const isPastCountdown = mounted && timeLeft.total <= 0;

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

  // When countdown hits zero, show the puzzle
  useEffect(() => {
    if (mounted && phase === "countdown" && timeLeft.total <= 0) {
      setPhase("puzzle");
    }
  }, [mounted, phase, timeLeft.total]);

  // After 6s of dramatic reveal, show the heart clue
  useEffect(() => {
    if (phase !== "reveal" || revealStage !== "dramatic") return;
    const t = setTimeout(() => setRevealStage("clue"), 6000);
    return () => clearTimeout(t);
  }, [phase, revealStage]);

  const checkPuzzleAnswer = useCallback(async () => {
    setPuzzleError("");
    setPuzzleChecking(true);
    try {
      const res = await fetch("/api/check-puzzle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: puzzleInput }),
      });
      const data = await res.json();
      if (data.error) {
        setPuzzleError(data.error);
        return;
      }
      if (data.correct) {
        setRevealStage("dramatic");
        setPhase("reveal");
        // Notify by email (fire-and-forget)
        fetch("/api/notify-puzzle-solved", { method: "POST" }).catch(() => {});
      } else {
        setPuzzleError("Not quite! Try again.");
      }
    } catch {
      setPuzzleError("Something went wrong. Try again.");
    } finally {
      setPuzzleChecking(false);
    }
  }, [puzzleInput]);

  const startTransition = useCallback(() => {
    setPhase("transitioning");
    setTimeout(() => setPhase("countdown"), 1200);
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
            {/* Hide card until mounted to avoid flash of wrong copy (pre vs post countdown) */}
            <div
              className={`flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8 text-center transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            >
              <Card className="juicy-card w-full max-w-2xl border-0 bg-white/90 backdrop-blur-md animate-[text-reveal_0.6s_ease-out_0.3s_both]">
                <CardHeader className="text-center space-y-2 pb-2 px-8 sm:px-10 pt-8 sm:pt-10">
                  <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight drop-shadow-sm">
                    {isPastCountdown ? "Welcome back, Neil 💕" : "Hey Neilll M💕"}
                  </CardTitle>
                  <CardDescription className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
                    {isPastCountdown
                      ? "Are you ready for your first hint?"
                      : "We're glad you're starting to find us."}
                  </CardDescription>
                </CardHeader>
                {phase === "intro" && (
                  <CardContent className="flex justify-center pt-2 pb-8 sm:pb-10">
                    <Button
                      size="lg"
                      onClick={startTransition}
                      className="juicy-btn rounded-2xl px-10 py-6 text-lg font-semibold text-white border-0 animate-[text-reveal_0.6s_ease-out_0.4s_both]"
                    >
                      {isPastCountdown ? "Get my first hint →" : "Continue →"}
                    </Button>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ——— COUNTDOWN ——— */}
        {phase === "countdown" && (
          <div className="flex w-full max-w-4xl flex-col items-center gap-6 sm:gap-8 text-center animate-[countdown-enter_0.8s_ease-out]">
            <Card className="juicy-card w-full max-w-3xl border-0 bg-white/90 backdrop-blur-md">
              <CardHeader className="space-y-2 pb-4 px-8 sm:px-10 pt-8 sm:pt-10">
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Your first clue arrives at midnight.
                </CardTitle>
                <CardDescription className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  When Valentine's Day begins — get ready, Neil 👀
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
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Days
                      </p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1 sm:gap-2">
                      <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_0.5s_infinite]">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Hours
                      </p>
                    </div>
                    <div className="juicy-countdown-block flex flex-col items-center gap-1 sm:gap-2">
                      <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums text-foreground animate-[countdown-pulse_2s_ease-in-out_1s_infinite]">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Minutes
                      </p>
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
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Seconds
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold text-foreground">
                    {mounted ? "00 : 00 : 00 : 00" : "Loading..."}
                  </div>
                )}

                <p className="text-base sm:text-lg text-muted-foreground font-medium">
                  ⏰ Midnight • February 14th, 2026
                </p>
                <p className="text-sm text-muted-foreground">
                  The wait is part of the mystery... or something like that 😉
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ——— PUZZLE (after countdown reaches zero) ——— */}
        {phase === "puzzle" && (
          <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center animate-[countdown-enter_0.6s_ease-out]">
            <Card className="juicy-card w-full border-0 bg-white/90 backdrop-blur-md">
              <CardHeader className="space-y-3 pb-4 px-8 sm:px-10 pt-8 sm:pt-10">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
                  🔐 One more step
                </CardTitle>
                <CardDescription className="text-base font-medium text-muted-foreground">
                  Word used to describe male gender + Word to signify indeterminate quantity.
                </CardDescription>
                <p className="text-lg font-semibold text-foreground">
                  Who am I?
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-8 sm:px-10 pb-8 sm:pb-10">
                <Input
                  type="text"
                  value={puzzleInput}
                  onChange={(e) => {
                    setPuzzleInput(e.target.value);
                    setPuzzleError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && checkPuzzleAnswer()}
                  placeholder="Your answer..."
                  className="h-12 rounded-xl text-lg border-2 border-primary/20 focus-visible:ring-4 focus-visible:ring-primary/20 transition-shadow"
                  autoFocus
                />
                <Button
                  size="lg"
                  onClick={checkPuzzleAnswer}
                  disabled={puzzleChecking}
                  className="juicy-btn rounded-xl h-12 text-lg font-semibold text-white border-0"
                >
                  {puzzleChecking ? "Checking…" : "Unlock my clue"}
                </Button>
                {puzzleError && (
                  <p className="text-destructive text-sm font-medium animate-[fadeIn_0.3s_ease-out]">
                    {puzzleError}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ——— GRAND REVEAL (first clue) ——— */}
        {phase === "reveal" && (
          <>
            {/* Full-screen red dramatic overlay (first 5–7s) */}
            {revealStage === "dramatic" && (
              <div
                className="pointer-events-none absolute inset-0 z-20 bg-red-600 animate-[reveal-dramatic-red_6s_ease-in-out_forwards]"
                aria-hidden
              />
            )}

            {/* Rain of hearts — heavier during dramatic */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
              {Array.from({ length: revealStage === "dramatic" ? 60 : 40 }).map((_, i) => (
                <span
                  key={`rain-${i}`}
                  className="absolute text-2xl sm:text-4xl select-none"
                  style={{
                    left: `${(i * 5) % 100}%`,
                    top: "-10%",
                    color: HEART_COLORS[i % HEART_COLORS.length],
                    animation: `reveal-hearts-rain ${3 + (i % 3)}s linear ${i * 0.12}s infinite`,
                  }}
                >
                  ♥
                </span>
              ))}
            </div>
            {/* Burst hearts — more during dramatic */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={`burst-${i}`}
                  className="absolute text-4xl sm:text-6xl md:text-7xl select-none"
                  style={{
                    color: HEART_COLORS[i % HEART_COLORS.length],
                    animation: `reveal-burst ${revealStage === "dramatic" ? 2.5 : 2}s ease-out ${(i * 0.06) % 2}s forwards`,
                    transform: `rotate(${i * 15}deg)`,
                  }}
                >
                  ♥
                </span>
              ))}
            </div>
            {/* Floating hearts */}
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
              {Array.from({ length: 28 }).map((_, i) => (
                <span
                  key={`float-${i}`}
                  className="absolute text-2xl sm:text-4xl select-none"
                  style={{
                    left: `${5 + (i * 3.5) % 90}%`,
                    top: `${10 + (i * 2.5) % 80}%`,
                    color: HEART_COLORS[i % HEART_COLORS.length],
                    animation: `float-heart ${2.5 + (i % 2)}s ease-in-out ${i * 0.15}s infinite`,
                  }}
                >
                  ♥
                </span>
              ))}
            </div>

            {/* During dramatic: big "You did it!" */}
            {revealStage === "dramatic" && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white animate-[reveal-dramatic-pulse_1.5s_ease-in-out_infinite]" style={{ textShadow: "0 0 40px rgba(255,255,255,0.5), 0 4px 20px rgba(0,0,0,0.3)" }}>
                  You did it! 💕
                </p>
              </div>
            )}

            {/* Heart-shaped clue — only after 6s dramatic transition */}
            {revealStage === "clue" && (
              <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 gap-8">
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-700 via-rose-600 to-red-700 bg-clip-text text-transparent drop-shadow-sm animate-[reveal-glow-pulse_2s_ease-in-out_infinite]">
                  💕 Your first clue 💕
                </p>
                <div
                  className="animate-[heart-clue-dance_1.1s_cubic-bezier(0.34,1.56,0.64,1)_forwards] relative"
                  style={{
                    width: "min(96vw, 520px)",
                    height: "min(96vw, 520px)",
                    maxWidth: "520px",
                    maxHeight: "520px",
                    transformOrigin: "center center",
                    filter: "drop-shadow(0 0 30px rgba(220,38,38,0.25)) drop-shadow(0 25px 50px -12px rgba(185,28,28,0.4))",
                  }}
                >
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="heartFill" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="50%" stopColor="#fef2f2" />
                        <stop offset="100%" stopColor="#fecaca" />
                      </linearGradient>
                      <filter id="heartGlow">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.2" />
                      </filter>
                      <clipPath id="heartClip" clipPathUnits="objectBoundingBox">
                        <path d="M 0.5 0.85 C 0.5 0.85 0.1 0.55 0.1 0.35 C 0.1 0.15 0.3 0.05 0.5 0.25 C 0.7 0.05 0.9 0.15 0.9 0.35 C 0.9 0.55 0.5 0.85 0.5 0.85 Z" />
                      </clipPath>
                    </defs>
                    <path
                      d="M 50 85 C 50 85 10 55 10 35 C 10 15 30 5 50 25 C 70 5 90 15 90 35 C 90 55 50 85 50 85 Z"
                      fill="url(#heartFill)"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      filter="url(#heartGlow)"
                    />
                  </svg>
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: "url(#heartClip)" }}
                  >
                    <img
                      src="/milk.png"
                      alt="First clue"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
