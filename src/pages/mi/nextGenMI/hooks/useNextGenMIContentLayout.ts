import useAuthStore from '@/store/useAuthStore'

export const useNextGenMIFillSpace = () => useAuthStore((state) => state.accessCompanyInfo?.customerCompanyNo === 2014)

export const useNextGenMIContentLayout = () => {
  const fillSpace = useNextGenMIFillSpace()

  return {
    maxWidth: fillSpace ? undefined : '1380px',
    margin: fillSpace ? 'auto clamp(30px, calc((100vw - 1380px) / 2), 80px)' : 'auto',
  } as const
}
