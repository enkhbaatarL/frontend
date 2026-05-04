import { createContext, useContext } from 'react'

/** `ScenarioWorkbenchPage` 상단(타이틀+탭)이 스크롤로 접힌 상태 */
const ScenarioWorkbenchHeaderCollapseContext = createContext(false)

export const ScenarioWorkbenchHeaderCollapseProvider = ScenarioWorkbenchHeaderCollapseContext.Provider

export const useScenarioWorkbenchHeaderCollapsed = () => useContext(ScenarioWorkbenchHeaderCollapseContext)
