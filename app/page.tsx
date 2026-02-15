"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const HEART_COLORS = ["#dc2626", "#f87171", "#f9a8d4", "#fff5f5", "#fecaca"];

type Phase = "intro" | "countdown" | "quordle" | "theme" | "reveal";
type CellState = "correct" | "present" | "absent";

// ========== COUNTDOWN & UNLOCK TIMES (change these to test) ==========
// 1. getTargetDate: used for the countdown display (e.g. "X days until Feb 15").
//    Change to whenever you want the countdown to reach zero (e.g. midnight Feb 15).
const getTargetDate = () => new Date("2026-02-15T00:00:00");

// 2. getSecondClueUnlockTime: when the "See 2nd clue" button becomes clickable.
//    - For BETA: set to a time soon (e.g. 8pm today = setHours(20, 0, 0, 0)).
//    - For PRODUCTION: set to midnight Feb 14, e.g.:
//        const d = new Date("2026-02-14T00:00:00"); return d;
//    - To test "unlocked" right now: set to past time, e.g. setHours(0, 0, 0, 0) and setDate(d.getDate() - 1).
const getSecondClueUnlockTime = () => {
  const d = new Date();
  d.setHours(24, 0, 0, 0); // 8pm today (beta)
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

const QUORDLE_ROWS = 9;

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());
  const [mounted, setMounted] = useState(false);
  const [quordleHistory, setQuordleHistory] = useState<{ guess: string; feedbacks: CellState[][] }[]>([]);
  const [quordleGuess, setQuordleGuess] = useState("");
  const [quordleChecking, setQuordleChecking] = useState(false);
  const [quordleError, setQuordleError] = useState("");
  const [themeAnswer, setThemeAnswer] = useState("");
  const [themeError, setThemeError] = useState("");
  const [themeChecking, setThemeChecking] = useState(false);
  const [secondClueUnlocked, setSecondClueUnlocked] = useState(false);
  const [revealImageExpanded, setRevealImageExpanded] = useState(false);

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

  const allFourSolved =
    quordleHistory.length > 0 &&
    [0, 1, 2, 3].every((gridIndex) =>
      quordleHistory.some((h) => h.feedbacks[gridIndex].every((c) => c === "correct"))
    );

  const quordleFailed =
    quordleHistory.length >= QUORDLE_ROWS && !allFourSolved;

  const showQuordle = useCallback(() => setPhase("quordle"), []);
  const goToSecondClue = useCallback(() => {
    if (secondClueUnlocked) setPhase("quordle");
    else setPhase("countdown");
  }, [secondClueUnlocked]);

  const submitQuordleGuess = useCallback(async () => {
    const g = quordleGuess.trim().toLowerCase();
    if (g.length !== 5 || quordleChecking || quordleHistory.length >= QUORDLE_ROWS) return;
    setQuordleError("");
    setQuordleChecking(true);
    try {
      const res = await fetch("/api/quordle-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guess: g,
          previousGuesses: quordleHistory.map((h) => h.guess),
        }),
      });
      const data = (await res.json()) as { error?: string; feedbacks?: CellState[][] };
      if (data.error) {
        setQuordleError(data.error);
        setQuordleChecking(false);
        return;
      }
      if (!data.feedbacks || data.feedbacks.length !== 4) {
        setQuordleError("Invalid response");
        setQuordleChecking(false);
        return;
      }
      const feedbacks: CellState[][] = data.feedbacks;
      setQuordleHistory((prev) => [...prev, { guess: g, feedbacks }]);
      setQuordleGuess("");
    } catch {
      setQuordleError("Something went wrong");
    } finally {
      setQuordleChecking(false);
    }
  }, [quordleGuess, quordleChecking, quordleHistory]);

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
        {/* ——— LANDING: one button "See 2nd clue" ——— */}
        {phase === "intro" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div
              className={`flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8 text-center transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            >
              <Card className="juicy-card w-full max-w-2xl border-0 bg-gradient-to-b from-white to-rose-50/50 backdrop-blur-md shadow-xl shadow-rose-900/10 animate-[text-reveal_0.6s_ease-out_0.3s_both]">
                <CardHeader className="text-center space-y-4 pb-2 px-8 sm:px-10 pt-8 sm:pt-10">
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight drop-shadow-sm">
                    We're almost there, Neil honey — are you ready for the second clue? 💕
                  </CardTitle>
                  <CardDescription className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-medium">
                    I hope you liked the first one as much as I like you. One more puzzle and then something sweet…
                  </CardDescription>
                  <p className="text-lg sm:text-xl font-semibold text-primary">
                    Happy Valentine's Day, Neily pooo!
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 justify-center pt-2 pb-8 sm:pb-10">
                  <Button
                    size="lg"
                    onClick={goToSecondClue}
                    className="juicy-btn rounded-2xl px-8 py-6 text-lg font-semibold text-white border-0"
                  >
                    See 2nd clue →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ——— COUNTDOWN PAGE: left = heart + Clue 1, right = countdown (old layout from git) ——— */}
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

            {/* Right: countdown to midnight */}
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
                <p className="text-sm text-muted-foreground italic pt-2">
                  p.s. check your email, especially your spam
                </p>
                <Button
                  variant="outline"
                  onClick={() => setPhase("intro")}
                  className="mt-4 rounded-xl border-2 border-rose-300 font-semibold w-full sm:w-auto"
                >
                  ← Back
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ——— QUORDLE (second clue) ——— */}
        {phase === "quordle" && (
          <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-[countdown-enter_0.5s_ease-out]">
            <Card className="juicy-card border-0 bg-gradient-to-b from-white via-white/98 to-rose-50/80 backdrop-blur-md shadow-xl shadow-rose-900/10">
              <CardHeader className="text-center pb-6 pt-8 px-6 sm:px-10">
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text text-transparent">
                  Second clue — guess all four words, Neil honey
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  9 tries • same guess counts for all four • green = right letter right spot, yellow = right letter wrong spot • valid 5-letter words only
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pb-10 px-4 sm:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {([0, 1, 2, 3] as const).map((gridIndex) => (
                    <div key={gridIndex} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/60 border border-rose-100 shadow-inner">
                      {Array.from({ length: QUORDLE_ROWS }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1.5 justify-center">
                          {Array.from({ length: 5 }, (_, colIndex) => {
                            const entry = quordleHistory[rowIndex];
                            const letter = entry?.guess[colIndex] ?? "";
                            const state = entry?.feedbacks[gridIndex]?.[colIndex];
                            const bg =
                              state === "correct"
                                ? "bg-emerald-600 shadow-md shadow-emerald-800/30 text-white"
                                : state === "present"
                                  ? "bg-amber-400 shadow-md shadow-amber-600/30 text-amber-950"
                                  : state === "absent"
                                    ? "bg-zinc-400/80 text-white"
                                    : "bg-white/80 border-2 border-rose-200/80 text-muted-foreground shadow-sm";
                            return (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg font-bold text-base sm:text-lg ${bg} transition-all duration-200`}
                              >
                                {letter.toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {quordleFailed && (
                  <div className="text-center space-y-4 pt-4">
                    <p className="text-lg font-semibold text-destructive">
                      You failed Neily poo, is your love for me fake?
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Refresh the page and try again.
                    </p>
                  </div>
                )}
                {!allFourSolved && !quordleFailed && quordleHistory.length < QUORDLE_ROWS && (
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <Input
                      value={quordleGuess}
                      onChange={(e) => {
                        setQuordleGuess(e.target.value.slice(0, 5).toLowerCase());
                        setQuordleError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && submitQuordleGuess()}
                      placeholder="5-letter word"
                      className="w-full sm:w-52 h-12 text-center text-lg font-mono uppercase tracking-widest rounded-xl border-2 border-rose-200/80 focus:border-primary shadow-sm"
                      maxLength={5}
                    />
                    <Button
                      onClick={submitQuordleGuess}
                      disabled={quordleGuess.length !== 5 || quordleChecking}
                      className="juicy-btn rounded-xl h-12 px-8 text-white border-0 font-semibold shadow-lg shadow-rose-900/25"
                    >
                      {quordleChecking ? "…" : "Guess"}
                    </Button>
                  </div>
                )}
                {quordleError && !quordleFailed && (
                  <p className="text-center text-destructive text-sm font-medium">{quordleError}</p>
                )}
                {allFourSolved && (
                  <div className="text-center space-y-4 pt-2">
                    <p className="text-lg font-semibold text-foreground">You did it, Neil honey! 💕</p>
                    <Button onClick={() => setPhase("theme")} className="juicy-btn rounded-xl text-white border-0 px-8 shadow-lg shadow-rose-900/25">
                      One more question →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
