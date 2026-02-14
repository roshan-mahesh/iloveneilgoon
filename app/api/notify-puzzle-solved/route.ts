import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY not set" },
      { status: 500 }
    );
  }

  const recipientsRaw = process.env.SUCCESS_EMAIL_RECIPIENTS ?? "";
  const recipients = recipientsRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (recipients.length === 0) {
    return NextResponse.json(
      { ok: false, error: "SUCCESS_EMAIL_RECIPIENTS is empty or not set in .env" },
      { status: 500 }
    );
  }

  // Use same default as daily-email so emails actually deliver (onboarding@resend.dev does not deliver to external inboxes)
  const from = process.env.RESEND_FROM ?? "Puzzle Notifier <noreply@iloveneil.gay>";
  const resend = new Resend(apiKey);

  const subject = "First hint revealed — Neil M solved the puzzle";
  const timestamp = new Date().toISOString();
  const text = `Someone (Neil M) just solved the puzzle and the first hint has been revealed.\n\nTime: ${timestamp}`;
  const html = `<p>Someone (Neil M) just solved the puzzle and the first hint has been revealed.</p><p>Time: ${timestamp}</p>`;

  try {
    const results = await Promise.all(
      recipients.map(async (to) => {
        const { data, error } = await resend.emails.send({
          from,
          to,
          subject,
          text,
          html,
        });
        return { to, id: data?.id, error: error?.message };
      })
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      return NextResponse.json(
        { ok: false, error: failed.map((f) => `${f.to}: ${f.error}`).join("; ") },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
