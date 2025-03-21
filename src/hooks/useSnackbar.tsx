import { enqueueSnackbar, OptionsObject, SnackbarMessage } from 'notistack'
import { ReactNode } from 'react'

export interface ISnackbarOptions extends OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'> {
  body?: ReactNode
}

const useSnackbar = () => {
  const showSnackbar = (message: SnackbarMessage, options?: ISnackbarOptions) => {
    return enqueueSnackbar(message, options)
  }

  return {
    showSnackbar,
  }
}

export default useSnackbar
