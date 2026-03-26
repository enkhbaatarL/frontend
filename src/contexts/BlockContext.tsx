import { createContext, useContext } from 'react'

const BlockContext = createContext(false)

export const useIsInsideBlock = () => useContext(BlockContext)

export { BlockContext }
