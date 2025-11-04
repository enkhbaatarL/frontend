import * as path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.VITE_API_BASE_URL
  const USE_EXTERNAL_LOGIN = env.VITE_USE_EXTERNAL_LOGIN

  console.info(`Run: ${mode} / Api: ${API_BASE_URL}`)
  if (USE_EXTERNAL_LOGIN !== undefined) {
    console.info(`[build-flag] USE_EXTERNAL_LOGIN: ${USE_EXTERNAL_LOGIN}`)
  }

  return {
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],
    },
    server: {
      allowedHosts: true,
      proxy: {
        '/api/v1': {
          target: API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
