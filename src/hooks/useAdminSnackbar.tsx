import { enqueueSnackbar, OptionsObject, SnackbarMessage } from 'notistack'
import { ReactNode } from 'react'

const useAdminSnackbar = () => {
  const showSnackbar = (
    message: SnackbarMessage,
    options?: OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'> & { body?: ReactNode },
  ) => {
    return enqueueSnackbar(message, options)
  }

  return {
    showSnackbar,
  }
}

export default useAdminSnackbar
