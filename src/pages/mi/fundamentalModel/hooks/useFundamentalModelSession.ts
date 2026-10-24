import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { observeModelInputSession } from '@/pages/mi/fundamentalModel/hooks/modelInputSession'

const useFundamentalModelSession = () => {
  const queryClient = useQueryClient()
  useEffect(() => observeModelInputSession(queryClient), [queryClient])
}

export default useFundamentalModelSession
