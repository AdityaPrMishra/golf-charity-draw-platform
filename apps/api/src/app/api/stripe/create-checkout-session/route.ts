import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/stripe";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { withCors } from "@/lib/http/cors";

export async function OPTIONS(request: Request) {
  return withCors(new NextResponse(null, { status: 204 }), request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user?.email) {
    return withCors(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      origin
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { plan?: "monthly" | "yearly" }
    | null;

  const plan = body?.plan;
  if (plan !== "monthly" && plan !== "yearly") {
    return withCors(
      NextResponse.json({ error: "Invalid plan" }, { status: 400 }),
      origin
    );
  }

  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;
  if (!priceId) {
    return withCors(
      NextResponse.json({ error: "Missing price id" }, { status: 500 }),
      origin
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return withCors(
      NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL" }, { status: 500 }),
      origin
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: {
      user_id: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
      },
    },
  });

  return withCors(NextResponse.json({ url: session.url }), origin);
}

