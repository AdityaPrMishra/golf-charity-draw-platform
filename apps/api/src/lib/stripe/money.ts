export function stripeCentsToAmount(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return n / 100;
}

export function isoDateFromUnixSeconds(s: number | null | undefined) {
  if (typeof s !== "number") return null;
  const d = new Date(s * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

