import { useMemo } from 'react'

interface EnvironmentInfo {
  isProd: boolean
  isDev: boolean
  isLocal: boolean
  isExternal: boolean
  hostname: string
  environment: 'external' | 'production' | 'development' | 'local'
}

const externalHostnames = new Set(['aimip.io', 'www.aimip.io', 'dev.aimip.io'])

/**
 * 현재 환경 정보를 반환하는 커스텀 훅
 * @returns {EnvironmentInfo} 환경 정보 객체
 */
const useEnvironment = (): EnvironmentInfo =>
  useMemo(() => {
    const hostname = globalThis.location.hostname

    const isExternal = externalHostnames.has(hostname)
    const isProd = hostname === 'mi.sk.com'
    const isLocal = hostname === 'localhost'
    const isDev = hostname === 'dev-mi.sk.com'

    let environment: 'external' | 'production' | 'development' | 'local'
    if (isExternal) {
      environment = 'external'
    } else if (isProd) {
      environment = 'production'
    } else if (isLocal) {
      environment = 'local'
    } else {
      environment = 'development'
    }

    return {
      isProd,
      isDev,
      isLocal,
      isExternal,
      hostname,
      environment,
    }
  }, [])

export default useEnvironment
