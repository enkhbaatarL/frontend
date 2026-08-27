import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { createNextGenMIListStateStore, NextGenMIListStateContext } from '@/pages/mi/nextGenMI/NextGenMIListStateContext'

/** 목록과 상세가 같은 Next-Gen MI 부모 라우트에 머무는 동안 목록 조회 조건을 유지합니다. */
const NextGenMIListStateProvider = () => {
  const [store] = useState(createNextGenMIListStateStore)

  return (
    <NextGenMIListStateContext.Provider value={store}>
      <Outlet />
    </NextGenMIListStateContext.Provider>
  )
}

export default NextGenMIListStateProvider
