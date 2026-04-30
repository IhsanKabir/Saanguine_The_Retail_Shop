/**
 * SSL Wireless SMS gateway client. Bangladesh-specific.
 * Failures are logged but never block order creation.
 *
 * Bangladesh phone format: must start with +880 or 88 or 01. Normalised to '8801XXXXXXXXX'.
 */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+880")) return digits.slice(1);
  if (digits.startsWith("880") && digits.length === 13) return digits;
  if (digits.startsWith("01") && digits.length === 11) return "880" + digits.slice(1);
  if (digits.startsWith("8801") && digits.length === 13) return digits;
  return null;
}

export async function sendSms(rawPhone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const apiToken = process.env.SSLWIRELESS_API_TOKEN;
  const sid = process.env.SSLWIRELESS_SID;
  if (!apiToken || !sid) {
    console.warn("[sms] missing SSLWIRELESS credentials — skipping send");
    return { ok: false, error: "missing-config" };
  }
  const phone = normalisePhone(rawPhone);
  if (!phone) {
    console.warn("[sms] invalid BD phone:", rawPhone);
    return { ok: false, error: "invalid-phone" };
  }
  const csmsId = "SSG-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  try {
    const res = await fetch("https://smsplus.sslwireless.com/api/v3/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_token: apiToken,
        sid,
        msisdn: phone,
        sms: message,
        csms_id: csmsId,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[sms] send failed", res.status, text);
      return { ok: false, error: `${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[sms] exception", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
