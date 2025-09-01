import { OptionsObject, SnackbarMessage, useSnackbar as useNotistackSnackbar } from 'notistack'
import { ReactNode, useCallback } from 'react'

export interface ISnackbarOptions extends OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'> {
  body?: ReactNode
}

const useSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useNotistackSnackbar()
  const showSnackbar = useCallback(
    (message: SnackbarMessage, options?: OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'> & { body?: ReactNode }) =>
      enqueueSnackbar(message, options),
    [enqueueSnackbar],
  )

  return {
    showSnackbar,
    closeSnackbar,
  }
}

export default useSnackbar
