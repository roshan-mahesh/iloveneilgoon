import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const validWords = new Set(require("sowpods-five") as string[]);

type CellState = "correct" | "present" | "absent";

function getFeedback(guess: string, target: string): CellState[] {
  const g = guess.toLowerCase().slice(0, 5).split("");
  const t = target.toLowerCase().split("");
  const result: CellState[] = [];
  const used: boolean[] = [false, false, false, false, false];

  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = "correct";
      used[i] = true;
    } else {
      result[i] = "absent";
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && g[i] === t[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { guess?: string; previousGuesses?: string[] };
    const { guess, previousGuesses = [] } = body;
    const raw = process.env.PUZZLE ?? "";
    const parts = raw.split(",").map((w) => w.trim().toLowerCase()).filter((w) => w.length === 5);
    // Allow 4 words (real Quordle) or 1 word repeated for all 4 grids (testing)
    const words =
      parts.length === 4
        ? parts
        : parts.length === 1
          ? [parts[0], parts[0], parts[0], parts[0]]
          : [];

    if (words.length !== 4) {
      return NextResponse.json(
        {
          error:
            "Server config: set PUZZLE in .env to either four 5-letter words (a,b,c,d) or one 5-letter word for testing.",
        },
        { status: 500 }
      );
    }

    const g = (guess ?? "").trim().toLowerCase();
    if (g.length !== 5) {
      return NextResponse.json(
        { error: "Guess must be 5 letters" },
        { status: 400 }
      );
    }
    const prevSet = new Set((previousGuesses ?? []).map((w) => w.trim().toLowerCase()));
    if (prevSet.has(g)) {
      return NextResponse.json(
        { error: "You already guessed that word" },
        { status: 400 }
      );
    }
    const puzzleSet = new Set(words);
    const isValid = validWords.has(g) || puzzleSet.has(g);
    if (!isValid) {
      return NextResponse.json(
        { error: "Not a valid word" },
        { status: 400 }
      );
    }

    const feedbacks = words.map((word) => getFeedback(g, word));
    return NextResponse.json({ feedbacks });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
