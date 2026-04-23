import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCors } from "@/lib/http/cors";
import { sendEmail } from "@/lib/email/resend";
import { subscriptionActive, subscriptionStatusChanged } from "@/lib/email/templates";
import { isoDateFromUnixSeconds, stripeCentsToAmount } from "@/lib/stripe/money";

export async function OPTIONS(request: Request) {
  return withCors(new NextResponse(null, { status: 204 }), request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return withCors(
      NextResponse.json({ error: "Missing webhook signature/secret" }, { status: 400 }),
      origin
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return withCors(NextResponse.json({ error: message }, { status: 400 }), origin);
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as "monthly" | "yearly" | undefined;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        const customerId =
          typeof session.customer === "string" ? session.customer : null;

        if (userId && subscriptionId) {
          await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              plan: plan ?? null,
              status: "active",
            },
            { onConflict: "stripe_subscription_id" }
          );

          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_plan: plan ?? null,
              stripe_customer_id: customerId ?? null,
            })
            .eq("id", userId);

          const { data: prof } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();
          if (prof?.email) {
            await sendEmail({
              to: prof.email,
              subject: "Subscription active",
              html: subscriptionActive(plan ?? null),
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const plan = (sub.metadata?.plan as "monthly" | "yearly" | undefined) ?? undefined;

        const status =
          sub.status === "active"
            ? "active"
            : sub.status === "canceled"
              ? "cancelled"
              : sub.status === "past_due" || sub.status === "unpaid"
                ? "lapsed"
                : "inactive";

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: status,
              subscription_plan: plan ?? null,
              subscription_renewal_date:
                typeof (sub as any).current_period_end === "number"
                  ? new Date(((sub as any).current_period_end as number) * 1000).toISOString()
                  : null,
            })
            .eq("id", userId);

          const { data: prof } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();
          if (prof?.email) {
            await sendEmail({
              to: prof.email,
              subject: "Subscription update",
              html: subscriptionStatusChanged(status, plan ?? null),
            });
          }
        }

        await supabase.from("subscriptions").upsert(
          {
            stripe_subscription_id: sub.id,
            user_id: userId ?? null,
            plan: plan ?? null,
            status: sub.status,
            current_period_start:
              typeof (sub as any).current_period_start === "number"
                ? new Date(((sub as any).current_period_start as number) * 1000).toISOString()
                : null,
            current_period_end:
              typeof (sub as any).current_period_end === "number"
                ? new Date(((sub as any).current_period_end as number) * 1000).toISOString()
                : null,
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }

      // Create charity contribution records on successful payments
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId =
          typeof (invoice as any).subscription === "string" ? ((invoice as any).subscription as string) : null;
        const stripeCustomerId =
          typeof (invoice as any).customer === "string" ? ((invoice as any).customer as string) : null;

        // Determine the billing period date (use invoice line period.start if present)
        const line0 = (invoice as any).lines?.data?.[0];
        const periodStart = line0?.period?.start ?? (invoice as any).period_start ?? null;
        const periodDate = isoDateFromUnixSeconds(periodStart);

        // Amount paid (major units)
        const amountPaid = stripeCentsToAmount(((invoice as any).amount_paid ?? (invoice as any).total ?? 0) as number);

        if (!stripeCustomerId || !stripeSubId || !periodDate || amountPaid <= 0) break;

        // Find profile + charity settings
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, charity_id, charity_contribution_percent")
          .eq("stripe_customer_id", stripeCustomerId)
          .maybeSingle();

        const userId = profile?.id;
        const charityId = profile?.charity_id;
        const percent = profile?.charity_contribution_percent ?? 10;
        if (!userId || !charityId) break;

        // Find our subscriptions row id for FK (optional)
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", stripeSubId)
          .maybeSingle();

        const contributionAmount = (amountPaid * percent) / 100;

        // Insert (dedupe guarded by unique index recommended)
        const { error: cErr } = await supabase.from("charity_contributions").upsert(
          {
            user_id: userId,
            charity_id: charityId,
            subscription_id: subRow?.id ?? null,
            amount: contributionAmount,
            contribution_percent: percent,
            period_date: periodDate,
          },
          { onConflict: "user_id,subscription_id,period_date" }
        );

        if (cErr) {
          // eslint-disable-next-line no-console
          console.error("[charity_contributions] upsert failed", cErr);
        }

        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook handler failed";
    return withCors(NextResponse.json({ error: message }, { status: 500 }), origin);
  }

  return withCors(NextResponse.json({ received: true }), origin);
}

