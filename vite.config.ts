/* eslint-disable import/no-extraneous-dependencies */
import * as path from 'node:path'

import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const POSITION_PLAY_REMOTE_URLS = {
  local: 'http://localhost:5174',
  dev: 'https://dev-mi-skgas-pp.sk.com',
  prod: 'https://mi-skgas-pp.sk.com',
} as const

const sharedDeps = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  'react-router': { singleton: true, requiredVersion: '^7.0.0' },
  'react-router-dom': { singleton: true, requiredVersion: '^7.0.0' },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.VITE_API_BASE_URL
  const USE_EXTERNAL_LOGIN = env.VITE_USE_EXTERNAL_LOGIN
  const profile = (env.VITE_PROFILE ?? '').trim().toLowerCase()
  const remoteUrl =
    env.VITE_POSITION_PLAY_REMOTE_URL ||
    POSITION_PLAY_REMOTE_URLS[profile as keyof typeof POSITION_PLAY_REMOTE_URLS] ||
    POSITION_PLAY_REMOTE_URLS.local

  console.info(`Run: ${mode} / Api: ${API_BASE_URL}`)
  console.info(`[build-flag] POSITION_PLAY_REMOTE: ${remoteUrl}`)
  if (USE_EXTERNAL_LOGIN !== undefined) {
    console.info(`[build-flag] USE_EXTERNAL_LOGIN: ${USE_EXTERNAL_LOGIN}`)
  }

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
