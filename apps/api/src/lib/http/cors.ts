import { NextResponse } from "next/server";

const defaultOrigin = "http://localhost:3000";

export function getAllowedOrigin(requestOrigin: string | null) {
  const allowed = process.env.API_ALLOWED_ORIGIN ?? defaultOrigin;
  if (!requestOrigin) return allowed;
  // Allow explicit configured origin only.
  return requestOrigin === allowed ? requestOrigin : allowed;
}

export function withCors(response: NextResponse, requestOrigin: string | null) {
  const origin = getAllowedOrigin(requestOrigin);
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "authorization, content-type, stripe-signature"
  );
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return response;
}

