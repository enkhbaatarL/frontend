import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'

import queryClient from '@/lib/queryClient'
import AuthProvider from '@/providers/AuthProvider'
import { AppRoutes } from '@/routes'
import theme from '@/theming'
import '@/styles/global.scss'
import '@/styles/utilities.scss'
import '@/lib/i18n'

const App = () => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </LocalizationProvider>
)

export default App
