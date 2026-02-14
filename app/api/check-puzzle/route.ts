import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { answer } = (await request.json()) as { answer?: string };
    const normalize = (s: string) =>
      (s ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
    const expected = normalize(process.env.PUZZLE ?? "");
    if (!expected) {
      return NextResponse.json(
        { correct: false, error: "Puzzle not configured. Set PUZZLE in .env" },
        { status: 500 }
      );
    }
    const normalized = normalize(answer ?? "");
    return NextResponse.json({ correct: normalized === expected });
  } catch {
    return NextResponse.json(
      { correct: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
