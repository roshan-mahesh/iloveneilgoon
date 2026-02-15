import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { answer } = (await request.json()) as { answer?: string };
    const trimmed = (answer ?? "").trim().toLowerCase();
    const accepted = ["bee", "bees"];
    const correct = accepted.includes(trimmed);
    return NextResponse.json({ correct });
  } catch {
    return NextResponse.json(
      { correct: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
