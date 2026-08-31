import { AuthService } from "./auth.js";
import { loadConfig, type RuntimeConfig } from "./config.js";
import { createApiServer, type ApiContext } from "./http.js";
import { createRepository, type Repository } from "./store.js";

export type ApiApplication = {
  config: RuntimeConfig;
  repository: Repository;
  auth: AuthService;
  server: ReturnType<typeof createApiServer>;
  close(): Promise<void>;
};

export function createApplication(
  env: NodeJS.ProcessEnv = process.env,
  overrides: { config?: RuntimeConfig; repository?: Repository; auth?: AuthService } = {},
): ApiApplication {
  const config = overrides.config ?? loadConfig(env);
  const repository = overrides.repository ?? createRepository(config);
  const auth = overrides.auth ?? new AuthService({
    repository,
    accessTokenSecret: config.accessTokenSecret,
    accessTokenTtlSeconds: config.accessTokenTtlSeconds,
    refreshTokenTtlSeconds: config.refreshTokenTtlSeconds,
  });
  const context: ApiContext = { config, repository, auth };
  const server = createApiServer(context);
  return {
    config,
    repository,
    auth,
    server,
    async close(): Promise<void> {
      if (server.listening) {
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      }
      await repository.close();
    },
  };
}

export * from "./auth.js";
export * from "./config.js";
export * from "./http.js";
export * from "./store.js";
