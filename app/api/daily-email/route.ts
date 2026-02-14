export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRecipients(): string[] {
  return parseList(process.env.DAILY_EMAIL_RECIPIENTS ?? "");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipients = getRecipients();
  if (recipients.length === 0) {
    console.error("[daily-email] No recipients configured (DAILY_EMAIL_RECIPIENTS empty or invalid)");
    return NextResponse.json(
      { error: "No recipients configured" },
      { status: 500 }
    );
  }

  const from = process.env.RESEND_FROM ?? "iloveneil.gay <noreply@iloveneil.gay>";

  // Resend allows 2 requests/second; space sends to avoid 429 rate limit
  const delayMs = 600;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    const results: { to: string; id: string | undefined }[] = [];
    for (let i = 0; i < recipients.length; i++) {
      if (i > 0) await sleep(delayMs);
      const email = recipients[i];
      const { data, error } = await resend.emails.send({
        from,
        to: email,
        subject: "Neil.... Your first puzzle is available 🧩✨",
        html: `<p>Neily pooo 🧩✨💕 the puzzle, your first puzzle dropped 🎉🔮💫🎊🪄🌟💎🔥❤️🌈🦋🌸✨🎯💖🕵️‍♀️🎭🌺🦄⚡️🍀🌙☀️🎈🎁🛸👾🤖💜🩵💛🩷</p>`,
      });
      if (error) {
        console.error(`[daily-email] Failed for ${email}:`, error);
        throw error;
      }
      results.push({ to: email, id: data?.id });
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
    });
  } catch (err) {
    console.error("[daily-email] Error:", err);
    return NextResponse.json(
      { error: "Failed to send daily emails" },
      { status: 500 }
    );
  }
}
