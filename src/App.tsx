import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'

import queryClient from '@/lib/queryClient'
import { AppRoutes } from '@/routes'
import '@/styles/global.scss'
import '@/styles/utilities.scss'
import '@/lib/i18n'

const App = () => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  </LocalizationProvider>
)

export default App
