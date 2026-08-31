import { createApplication } from "./index.js";

const application = createApplication();

application.server.listen(application.config.port, application.config.host, () => {
  console.log(
    JSON.stringify({
      level: "info",
      message: "nuttie api listening",
      host: application.config.host,
      port: application.config.port,
      repository: application.repository.mode,
    }),
  );
});

let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  console.log(JSON.stringify({ level: "info", message: "shutting down", signal }));
  const forceTimer = setTimeout(() => process.exit(1), 10_000);
  forceTimer.unref();
  try {
    await application.close();
    process.exitCode = 0;
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  } finally {
    clearTimeout(forceTimer);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
