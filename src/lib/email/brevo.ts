/**
 * Brevo (Sendinblue) transactional email client.
 * Free tier: 300 emails/day. Failures are logged but never block order creation.
 */
type SendArgs = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "Maison Ssanguine";

  if (!apiKey || !fromEmail) {
    console.warn("[brevo] missing BREVO_API_KEY or BREVO_FROM_EMAIL — skipping send");
    return { ok: false, error: "missing-config" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: args.to, name: args.toName || args.to }],
        replyTo: args.replyTo ? { email: args.replyTo } : undefined,
        subject: args.subject,
        htmlContent: args.html,
        textContent: args.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[brevo] send failed", res.status, text);
      return { ok: false, error: `${res.status}: ${text}` };
    }
    const json = await res.json();
    return { ok: true, id: json.messageId };
  } catch (e) {
    console.error("[brevo] exception", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
