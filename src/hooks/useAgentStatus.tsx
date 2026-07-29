import { useState } from 'react'

export enum AgentStatus {
  GENERATING = 'generating',
  COMPLETE = 'complete',
}

const useAgentStatus = () => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)

  const processing = async (callback: () => Promise<() => void>) => {
    try {
      setAgentStatus(AgentStatus.GENERATING)
      const result = await callback()
      setAgentStatus(AgentStatus.COMPLETE)
      setTimeout(() => {
        setAgentStatus(null)
        result()
      }, 1000)
    } catch {
      return
    }
  }

  return {
    agentStatus,
    processing,
  }
}

export default useAgentStatus
