import { useMemo } from 'react'

interface EnvironmentInfo {
  isProd: boolean
  isDev: boolean
  isLocal: boolean
  hostname: string
  environment: 'production' | 'development' | 'local'
}

/**
 * 현재 환경 정보를 반환하는 커스텀 훅
 * @returns {EnvironmentInfo} 환경 정보 객체
 */
const useEnvironment = (): EnvironmentInfo =>
  useMemo(() => {
    const hostname = window.location.hostname

    const isProd = hostname === 'mi.sk.com'
    const isLocal = hostname === 'localhost'
    const isDev = hostname === 'dev-mi.sk.com'

    let environment: 'production' | 'development' | 'local'
    if (isProd) {
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
      hostname,
      environment,
    }
  }, [])

export default useEnvironment
