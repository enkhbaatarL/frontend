import { render } from '@react-email/render'
import { ReactNode, useCallback, useState } from 'react'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import { EmailContentTemplate } from '@/pages/mi/newsletter/components/view/EmailContent'

export const useRenderEmailContent = () => {
  const [html, setHtml] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const renderContent = useCallback(
    async (
      snapshot: INewsletterIssueSnapshotData | null,
      chartNode?: ReactNode,
      referenceChartImages?: (string | undefined)[],
      coverImage?: string,
      oilPriceRowImage?: string,
    ) => {
      setIsLoading(true)
      try {
        const result = snapshot
          ? await render(
            <EmailContentTemplate
              snapshot={snapshot}
              chartNode={chartNode}
              referenceChartImages={referenceChartImages}
              coverImage={coverImage}
              oilPriceRowImage={oilPriceRowImage}
            />,
          )
          : ''
        setHtml(result)
        return result
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { html, isLoading, render: renderContent }
}
