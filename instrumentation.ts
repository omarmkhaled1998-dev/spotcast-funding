/**
 * Next.js Instrumentation — runs once on server startup.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Starts the health worker cron job only on the Node.js runtime (not Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startHealthWorker } = await import("./lib/monitoring/health-worker");
    startHealthWorker();
  }
}
