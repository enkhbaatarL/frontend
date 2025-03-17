import * as path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({mode}) =>{
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.VITE_API_BASE_URL

  console.info(`Run: ${mode} / Api: ${API_BASE_URL}`)
  
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
      proxy: {
        '/api/v1': {
          target: API_BASE_URL,
          changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api\/v1/, '')
        },
      },
    },
  }
}
)
