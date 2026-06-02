import { createContext, useContext } from 'react'

/** `NextGenMIPage` 상단(타이틀+탭)이 스크롤로 접힌 상태 */
const NextGenMIHeaderCollapseContext = createContext(false)

export const NextGenMIHeaderCollapseProvider = NextGenMIHeaderCollapseContext.Provider

export const useNextGenMIHeaderCollapsed = () => useContext(NextGenMIHeaderCollapseContext)
