import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
export const resend = key ? new Resend(key) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Golf Charity <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log("[email] RESEND_API_KEY missing; skipping send", {
      to: opts.to,
      subject: opts.subject,
    });
    return { skipped: true as const };
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) throw new Error(error.message);
  return { skipped: false as const, id: data?.id };
}

