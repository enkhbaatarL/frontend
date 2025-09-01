import { useEffect } from 'react'

import useSnackbar from '@/hooks/useSnackbar'
import { removeErrorHandlerOptions, setErrorHandlerOptions } from '@/lib/axios'

const AxiosErrorHandler = () => {
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    setErrorHandlerOptions({ showSnackbar })

    return () => {
      removeErrorHandlerOptions()
    }
  }, [showSnackbar])

  return null
}

export default AxiosErrorHandler
