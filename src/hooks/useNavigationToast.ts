import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import useSnackbar from './useSnackbar'

interface NavigationToastState {
  successMessage?: string
  errorMessage?: string
  warningMessage?: string
  infoMessage?: string
  body?: string
}

const useNavigationToast = () => {
  const location = useLocation()
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const state = location.state as NavigationToastState | null

    if (state) {
      if (state.successMessage) {
        showSnackbar(state.successMessage, {
          variant: 'success',
          body: state.body,
        })
      }

      if (state.errorMessage) {
        showSnackbar(state.errorMessage, {
          variant: 'error',
          body: state.body,
        })
      }

      if (state.warningMessage) {
        showSnackbar(state.warningMessage, {
          variant: 'warning',
          body: state.body,
        })
      }

      if (state.infoMessage) {
        showSnackbar(state.infoMessage, {
          variant: 'info',
          body: state.body,
        })
      }

      // state 정리
      window.history.replaceState(null, document.title, location.pathname + location.search)
    }
  }, [location.state, location.pathname, location.search, showSnackbar])
}

export default useNavigationToast
