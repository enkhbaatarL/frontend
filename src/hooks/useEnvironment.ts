import { useMemo } from 'react'

interface EnvironmentInfo {
  isProd: boolean
  isDev: boolean
  isLocal: boolean
  useExternalLogin: boolean
  hostname: string
  environment: 'external' | 'production' | 'development' | 'local'
  profile: 'local' | 'dev' | 'prod'
}

/**
 * 현재 환경 정보를 반환하는 커스텀 훅
 * @returns {EnvironmentInfo} 환경 정보 객체
 */
const useEnvironment = (): EnvironmentInfo =>
  useMemo(() => {
    const hostname = globalThis.location.hostname

    const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env

    const rawProfile = (env.VITE_PROFILE ?? '').trim().toLowerCase()
    const rawEnvironment = (env.VITE_ENVIRONMENT ?? env.VITE_APP_ENV ?? '').trim().toLowerCase()
    const rawUseExternalLogin = (env.VITE_USE_EXTERNAL_LOGIN ?? '').trim().toLowerCase()

    const useExternalLogin = rawUseExternalLogin === 'true'

    const mapEnv = (value: string) => {
      switch (value) {
        case 'production':
        case 'prod':
          return 'production'
        case 'development':
        case 'dev':
          return 'development'
        case 'local':
          return 'local'
        default:
          return undefined
      }
    }

    const fromProfile = mapEnv(rawProfile)
    const fromEnvironment = mapEnv(rawEnvironment)
    const environment = fromProfile ?? fromEnvironment ?? 'development' // 우선순위 반영

    const isProd = environment === 'production'
    const isDev = environment === 'development'
    const isLocal = environment === 'local'

    let profile: 'local' | 'dev' | 'prod'
    if (isLocal) profile = 'local'
    else if (isProd) profile = 'prod'
    else profile = 'dev'

    return {
      isProd,
      isDev,
      isLocal,
      useExternalLogin,
      hostname,
      environment,
      profile,
    }
  }, [])

export default useEnvironment
