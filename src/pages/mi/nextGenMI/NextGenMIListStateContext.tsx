import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from 'react'

interface NextGenMIListStateStore {
  getState: <T>(key: string, initialState: T) => T
  initializeState: <T>(key: string, initialState: T) => void
  subscribe: (key: string, listener: () => void) => () => void
  updateState: <T>(key: string, initialState: T, action: SetStateAction<T>) => void
}

export const createNextGenMIListStateStore = (): NextGenMIListStateStore => {
  const stateByKey = new Map<string, unknown>()
  const listenersByKey = new Map<string, Set<() => void>>()

  return {
    getState: <T,>(key: string, initialState: T) => (stateByKey.has(key) ? (stateByKey.get(key) as T) : initialState),
    initializeState: <T,>(key: string, initialState: T) => {
      if (!stateByKey.has(key)) stateByKey.set(key, initialState)
    },
    subscribe: (key, listener) => {
      const listeners = listenersByKey.get(key) ?? new Set()
      listeners.add(listener)
      listenersByKey.set(key, listeners)

      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) listenersByKey.delete(key)
      }
    },
    updateState: <T,>(key: string, initialState: T, action: SetStateAction<T>) => {
      const currentState = stateByKey.has(key) ? (stateByKey.get(key) as T) : initialState
      const nextState = typeof action === 'function' ? (action as (currentState: T) => T)(currentState) : action

      if (Object.is(currentState, nextState)) return
      stateByKey.set(key, nextState)
      listenersByKey.get(key)?.forEach((listener) => listener())
    },
  }
}

export const NextGenMIListStateContext = createContext<NextGenMIListStateStore | null>(null)

const useNextGenMIListStateStore = () => {
  const store = useContext(NextGenMIListStateContext)

  if (!store) {
    throw new Error('useNextGenMIListState must be used within NextGenMIListStateProvider')
  }

  return store
}

export const useNextGenMIListState = <T,>(key: string, initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>] => {
  const store = useNextGenMIListStateStore()
  const [resolvedInitialState] = useState<T>(() => (typeof initialState === 'function' ? (initialState as () => T)() : initialState))
  const subscribe = useCallback((listener: () => void) => store.subscribe(key, listener), [key, store])
  const getSnapshot = useCallback(() => store.getState(key, resolvedInitialState), [key, resolvedInitialState, store])
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    store.initializeState(key, resolvedInitialState)
  }, [key, resolvedInitialState, store])

  const setState = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => store.updateState(key, resolvedInitialState, action),
    [key, resolvedInitialState, store],
  )

  return [state, setState]
}
