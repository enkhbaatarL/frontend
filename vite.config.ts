/* eslint-disable import/no-extraneous-dependencies */
import * as path from 'node:path'

import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const POSITION_PLAY_REMOTE_URL = 'http://localhost:5174'
/** 임시: preview를 dev와 동일 포트로 맞춤 (동시에 둘 다 띄우면 충돌) */
const APP_PORT = 5173

const sharedDeps = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  'react-router-dom': { singleton: true, requiredVersion: '^7.0.0' },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.VITE_API_BASE_URL
  const USE_EXTERNAL_LOGIN = env.VITE_USE_EXTERNAL_LOGIN
  const remoteUrl = env.VITE_POSITION_PLAY_REMOTE_URL || POSITION_PLAY_REMOTE_URL

  console.info(`Run: ${mode} / Api: ${API_BASE_URL}`)
  if (USE_EXTERNAL_LOGIN !== undefined) {
    console.info(`[build-flag] USE_EXTERNAL_LOGIN: ${USE_EXTERNAL_LOGIN}`)
  }

  const apiProxy =
    API_BASE_URL && /^https?:\/\//i.test(API_BASE_URL.trim())
      ? {
        '/api/v1': {
          target: API_BASE_URL.trim(),
          changeOrigin: true,
        },
      }
      : undefined

  return {
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      federation({
        name: 'hostApp',
        remotes: {
          positionPlayRemote: `${remoteUrl}/assets/remoteEntry.js`,
        },
        shared: sharedDeps as never,
      }),
    ],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],
    },
    build: {
      modulePreload: false,
      target: 'esnext',
    },
    server: {
      port: APP_PORT,
      allowedHosts: true,
      ...(apiProxy ? { proxy: apiProxy } : {}),
    },
    preview: {
      port: APP_PORT,
      ...(apiProxy ? { proxy: apiProxy } : {}),
    },
  }
})
