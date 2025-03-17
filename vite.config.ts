import * as path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
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
        target: 'http://localhost:4010',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api\/v1/, '')
      },
    },
  },
})
