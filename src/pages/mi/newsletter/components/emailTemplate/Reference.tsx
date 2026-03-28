import { Fragment, type CSSProperties, type ReactNode } from 'react'

import type { INewsletterIssueSnapshotData, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import ReferenceChart from '@/pages/mi/newsletter/components/chart/ReferenceChart'
import ItemTitle from '@/pages/mi/newsletter/components/emailTemplate/ItemTitle'
import ReferenceTable from '@/pages/mi/newsletter/components/emailTemplate/ReferenceTable'
import ChangedLabel from '@/pages/mi/newsletter/components/view/ChangedLabel'
import {
  chartViewFromBlock,
  getBlockFields,
  getReferenceContentBlocks,
  isReferenceBlockRemoved,
  tableViewFromBlock,
  wasReferenceContentBlockRemovedInSnapshot,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { EMAIL_FONT_FAMILY } from '@/utils/email'

interface ReferenceProps {
  section: INewsletterSnapshotSection
  marketOpenTime?: number
  marketCloseTime?: number
  chartImages?: (string | undefined)[]
  onReferenceChartImageReady?: (flatChartIndex: number, image: string) => void
  flatChartStartIndex?: number
  useLiveChart?: boolean
  titleDiffHtml?: string
  descriptionDiffHtml?: string
  /** true면 `state.removed` 참고 블록도 렌더(리비전 Diff 등) */
  showRemovedBlocks?: boolean
  /** 비교 스냅샷 — 직전에도 삭제된 블록은 숨김 */
  diffComparisonSnapshot?: INewsletterIssueSnapshotData | null
}

const Reference = ({
  section,
  marketOpenTime,
  marketCloseTime,
  chartImages = [],
  onReferenceChartImageReady,
  flatChartStartIndex = 0,
  useLiveChart,
  titleDiffHtml,
  descriptionDiffHtml,
  showRemovedBlocks = false,
  diffComparisonSnapshot = null,
}: ReferenceProps) => {
  // 편집기 눈 아이콘 숨김(`visibility=false`)은 view/미리보기/이메일에서 항상 제외합니다.
  const allBlocks = getReferenceContentBlocks(section).filter((b) => b.visibility !== false)
  const withRemoved = showRemovedBlocks ? allBlocks : allBlocks.filter((b) => !isReferenceBlockRemoved(b))
  const displayBlocks =
    showRemovedBlocks && diffComparisonSnapshot
      ? withRemoved.filter((b) => {
        if (!isReferenceBlockRemoved(b)) return true
        return !wasReferenceContentBlockRemovedInSnapshot(diffComparisonSnapshot, section.id, b.id)
      })
      : withRemoved
  let chartIndex = 0
  const sf = section.fields ?? {}
  const title = String(sf.title ?? '')
  const description = String(sf.description ?? '')

  return (
    <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ paddingTop: '12px', paddingBottom: '24px' }}>
            <ItemTitle title={title} subtitle={description} titleDiffHtml={titleDiffHtml} subtitleDiffHtml={descriptionDiffHtml} />
          </td>
        </tr>

        {displayBlocks.map((block) => {
          const blockRemoved = isReferenceBlockRemoved(block)
          const removedNonTextStyle: CSSProperties | undefined = blockRemoved ? { opacity: 0.72 } : undefined

          if (block.type === 'CHART') {
            let localIdx = 0
            let chartImage: string | undefined
            if (!blockRemoved) {
              localIdx = chartIndex
              chartIndex += 1
              chartImage = chartImages[localIdx]
            }
            const flatIdx = flatChartStartIndex + localIdx
            const chartData = chartViewFromBlock(block)
            const hasChartPayload =
              (chartData.timestamps?.length ?? 0) > 0 || (chartData.series?.some((s) => (s.values?.length ?? 0) > 0) ?? false)
            const renderChart = useLiveChart && hasChartPayload
            const renderImage = !useLiveChart && hasChartPayload && chartImage

            let chartCellContent: ReactNode = null
            if (renderChart) {
              chartCellContent = (
                <ReferenceChart
                  chartData={chartData}
                  marketOpenTime={marketOpenTime}
                  marketCloseTime={marketCloseTime}
                  onChartImageReady={(img) => onReferenceChartImageReady?.(flatIdx, img)}
                />
              )
            } else if (renderImage) {
              chartCellContent = <img src={chartImage} alt="chart" width={800} style={{ display: 'block', width: '800px', border: 0 }} />
            }

            return (
              <tr key={block.id}>
                <td style={{ position: 'relative', ...removedNonTextStyle }}>
                  {blockRemoved && <ChangedLabel labelKind="deleted" top="12px" />}
                  <table
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="800"
                    style={{
                      borderCollapse: 'collapse',
                      width: '800px',
                      background: '#FFFFFF',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ fontSize: 0, lineHeight: 0 }}>{chartCellContent}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            )
          }
          if (block.type === 'TABLE') {
            return (
              <tr key={block.id}>
                <td style={{ paddingLeft: '16px', position: 'relative', ...removedNonTextStyle }}>
                  {blockRemoved && <ChangedLabel labelKind="deleted" top="12px" />}
                  <ReferenceTable tableData={tableViewFromBlock(block)} width="760" />
                </td>
              </tr>
            )
          }
          if (block.type === 'IMAGE') {
            const img = getBlockFields<{ imageBase64?: string; content?: string }>(block)
            const src = String(img?.imageBase64 ?? '')
            const caption = String(img?.content ?? '')
            const imageTitle = String(block.title ?? '').trim()
            if (!src && !blockRemoved) return null
            return (
              <tr key={block.id}>
                <td
                  style={{
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    position: 'relative',
                    ...removedNonTextStyle,
                  }}
                >
                  {blockRemoved && <ChangedLabel labelKind="deleted" top="12px" />}
                  <table cellPadding={0} cellSpacing={0} border={0} width="800" style={{ borderCollapse: 'collapse', width: '800px' }}>
                    <tbody>
                      {imageTitle ? (
                        <tr>
                          <td
                            style={{
                              paddingLeft: '16px',
                              paddingRight: '16px',
                              paddingBottom: '8px',
                              fontSize: '15px',
                              fontWeight: 700,
                              lineHeight: '21px',
                              color: '#212529',
                            }}
                          >
                            {imageTitle}
                          </td>
                        </tr>
                      ) : null}
                      {src ? (
                        <tr>
                          <td style={{ fontSize: 0, lineHeight: 0 }}>
                            <img src={src} alt="" width={800} style={{ display: 'block', width: '800px', maxWidth: '100%', border: 0 }} />
                          </td>
                        </tr>
                      ) : null}
                      {caption ? (
                        <tr>
                          <td
                            style={{
                              paddingTop: '12px',
                              paddingLeft: '16px',
                              paddingRight: '16px',
                              fontSize: '14px',
                              lineHeight: '21px',
                              color: '#333333',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {caption}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </td>
              </tr>
            )
          }
          if (block.type === 'TEXT' && (block.id ?? '').includes('REFERENCE_CONTENT')) {
            const text = String(getBlockFields<{ content?: string }>(block)?.content ?? '')
            const textTitle = String(block.title ?? '').trim()
            const hasContent = text.trim().length > 0
            if (!hasContent && !textTitle && !blockRemoved) return null
            if (!hasContent && !textTitle && blockRemoved) {
              return (
                <tr key={block.id}>
                  <td style={{ position: 'relative', paddingBottom: '24px' }}>
                    <ChangedLabel labelKind="deleted" top="8px" />
                  </td>
                </tr>
              )
            }

            const titleInnerStyle: CSSProperties = {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#212529',
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: '20px',
              fontWeight: 600,
              lineHeight: '28px',
              opacity: blockRemoved ? 0.72 : undefined,
              textDecoration: blockRemoved ? 'line-through' : undefined,
            }
            const contentCellStyle: CSSProperties = {
              paddingBottom: '24px',
              color: '#495057',
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: '27px',
              opacity: blockRemoved ? 0.72 : undefined,
              textDecoration: blockRemoved ? 'line-through' : undefined,
            }

            return (
              <Fragment key={block.id}>
                {textTitle ? (
                  <tr>
                    <td
                      style={{
                        ...titleInnerStyle,
                        position: 'relative',
                        paddingBottom: hasContent ? '10px' : '24px',
                      }}
                    >
                      {blockRemoved && <ChangedLabel labelKind="deleted" top="8px" />}
                      {textTitle}
                    </td>
                  </tr>
                ) : null}
                {hasContent ? (
                  <tr>
                    <td style={{ ...contentCellStyle, position: 'relative' }}>
                      {!textTitle && blockRemoved && <ChangedLabel labelKind="deleted" top="8px" />}
                      {text.split('\n').map((line, lineIdx) => (
                        <Fragment key={lineIdx}>
                          {lineIdx > 0 ? <br /> : null}
                          {line}
                        </Fragment>
                      ))}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          }
          return null
        })}
      </tbody>
    </table>
  )
}

export default Reference
