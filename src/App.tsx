import { QueryClientProvider } from '@tanstack/react-query'

import queryClient from '@/lib/queryClient'
import { AppRoutes } from '@/routes'
import '@/styles/global.scss'
import '@/styles/utilities.scss'
import '@/lib/i18n'

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  )
}

export default App
