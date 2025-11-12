import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    server: {
      port: env.VITE_PORT ? Number.parseInt(env.VITE_PORT) : 3000,
    },
  };
});
