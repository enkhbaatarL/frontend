import { enqueueSnackbar, OptionsObject, SnackbarMessage } from 'notistack'
import { ReactNode, useCallback } from 'react'

export interface ISnackbarOptions extends OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'> {
  body?: ReactNode
}

const useSnackbar = () => {
  const showSnackbar = useCallback((message: SnackbarMessage, options?: ISnackbarOptions) => enqueueSnackbar(message, options), [])

  return {
    showSnackbar,
  }
}

export default useSnackbar
