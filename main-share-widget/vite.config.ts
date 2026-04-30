import { defineConfig } from 'vite'
const fs = require("fs");
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue()],
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    port: 8204,
    host: true,
    https: {
      ca: fs.readFileSync("../localhost+1.pem"),
      key: fs.readFileSync('../localhost+1-key.pem'),
      cert: fs.readFileSync('../localhost+1.crt'),
    },
  }
})
