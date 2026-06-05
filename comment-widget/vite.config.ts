import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

function loadMkcertHttps(): { key: Buffer; cert: Buffer; ca?: Buffer } | null {
  const parentDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const keyPath = resolve(parentDir, "localhost+1-key.pem");
  const certPath = resolve(parentDir, "localhost+1.crt");
  const caPath = resolve(parentDir, "localhost+1.pem");
  try {
    if (!existsSync(keyPath) || !existsSync(certPath)) return null;
    return {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
      ...(existsSync(caPath) ? { ca: readFileSync(caPath) } : {})
    };
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  const mkcert = loadMkcertHttps();

  const server = {
    port: 8203,
    host: true,
    cors: {
      origin: true,
      credentials: true
    },
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    https: mkcert ?? undefined
  };

  return {
    base: "./",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    plugins: [vue()],
    server
  };
});
