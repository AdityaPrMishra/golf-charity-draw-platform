export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: "40rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Golf Charity Draw — API</h1>
      <p style={{ marginTop: "0.75rem", color: "#525252" }}>
        This service exposes JSON routes and webhooks. Use{" "}
        <a href="/api/health" style={{ color: "#171717", fontWeight: 500 }}>
          /api/health
        </a>{" "}
        to verify the deployment.
      </p>
    </main>
  );
}
