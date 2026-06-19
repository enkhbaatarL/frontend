import type { ScenarioDesignReviewErrorItem } from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignCriteriaStep'

type ScenarioDesignBackendReviewItem = ScenarioDesignReviewErrorItem & {
  headline?: string
  messageLines: string[]
}

const createScenarioDesignReviewFallbackErrorItem = (message: string): ScenarioDesignReviewErrorItem => ({
  label: '검토 결과',
  message,
  severity: 'error',
  actionLabel: '수정 필요',
})

const formatScenarioDesignReviewMessage = (message: string) =>
  message
    .split('\n')
    .flatMap(
      (line) =>
        line
          .match(/[^.]+(?:\.|$)/g)
          ?.map((sentence) => sentence.trim())
          .filter(Boolean) ?? [],
    )
    .join('\n')

export const createScenarioDesignBackendReviewItems = (reason: string): ScenarioDesignReviewErrorItem[] => {
  const parsedItems: ScenarioDesignBackendReviewItem[] = []

  reason
    .split(/\\n|\r?\n/)
    .map((line) => line.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)
    .forEach((line) => {
      if (/^검토 결과\s*[\u2013\u2014-]/.test(line)) return

      const issueMatch = line.match(/^(?:[•*-]\s*)?\[(주의|경고|warn|warning|오류|에러|error)\]\s*(.*?)(?:\s*[\u2013\u2014-]\s*(.*))?$/i)

      if (issueMatch) {
        const severityLabel = issueMatch[1]
        const label = issueMatch[2]?.trim() || '검토 결과'
        const headline = issueMatch[3]?.trim()
        parsedItems.push({
          label,
          headline,
          message: '',
          messageLines: [],
          severity: /^(주의|경고|warn|warning)$/i.test(severityLabel) ? 'warning' : 'error',
        })
        return
      }

      const currentItem = parsedItems.at(-1)
      if (currentItem) currentItem.messageLines.push(line.replace(/^\u2514\s*/, ''))
    })

  if (parsedItems.length === 0) return [createScenarioDesignReviewFallbackErrorItem(reason)]

  return parsedItems.map(({ headline, messageLines, ...item }) => ({
    ...item,
    message: formatScenarioDesignReviewMessage(messageLines.join('\n') || headline || item.label),
  }))
}
