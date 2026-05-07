import DOMPurify from 'dompurify'
import { Fragment, type CSSProperties, type ReactNode } from 'react'

import type { ReferenceBlockDiff } from '@/pages/mi/newsletter/hooks/useDocumentDiff'
import type { INewsletterSnapshotSection } from '@/service/mi/newsletter'

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
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled, msoPaddingAltScaled, outlookMsoFontSize } from '@/utils/email'

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
  /** 블록 id → diff 정보 (kind + diff HTML) */
  blockChanges?: Record<string, ReferenceBlockDiff>
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
  blockChanges,
}: ReferenceProps) => {
  // 일반 렌더는 현재 보이는 블록만, 변경이력은 net diff상 삭제된 블록까지 표시합니다.
  const allBlocks = getReferenceContentBlocks(section)
  const displayBlocks = allBlocks.filter((block) => {
    const isActive = block.visibility && !isReferenceBlockRemoved(block)
    if (isActive) return true
    return showRemovedBlocks && blockChanges?.[block.id]?.kind === 'deleted'
  })
  let chartIndex = 0
  const sf = section.fields ?? {}
  const title = String(sf.title ?? '')
  const description = String(sf.description ?? '')

  return (
    <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ paddingTop: '12px', paddingBottom: '24px', ...({ msoPaddingAlt: '6px 0 12px 0' } as CSSProperties) }}>
            <ItemTitle title={title} subtitle={description} titleDiffHtml={titleDiffHtml} subtitleDiffHtml={descriptionDiffHtml} />
          </td>
        </tr>

        {displayBlocks.map((block) => {
          const blockDiff = blockChanges?.[block.id]
          const blockChangeKind = blockDiff?.kind
          const blockDeleted = blockChangeKind === 'deleted' || isReferenceBlockRemoved(block)
          const removedNonTextStyle: CSSProperties | undefined = blockDeleted ? { opacity: 0.72 } : undefined
          const addedBlockBg = !blockDeleted && blockChangeKind === 'added' ? '#e6f7ee' : undefined

          if (block.type === 'CHART') {
            let localIdx = 0
            let chartImage: string | undefined
            if (!blockDeleted) {
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

            const chartContent = String(getBlockFields<{ content?: string }>(block)?.content ?? '')
            const chartContentHtml = blockDiff?.contentDiffHtml
            return (
              <Fragment key={block.id}>
                <tr>
                  <td
                    style={{ padding: 0, position: 'relative', ...removedNonTextStyle, ...({ msoPaddingAlt: '0 0 0 0' } as CSSProperties) }}
                  >
                    {blockDeleted && <ChangedLabel labelKind="deleted" top="12px" />}
                    {!blockDeleted && blockChangeKind && <ChangedLabel labelKind={blockChangeKind} top="12px" />}
                    <table
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      width="800"
                      style={{
                        borderCollapse: 'collapse',
                        width: '800px',
                        background: addedBlockBg ?? '#FFFFFF',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              fontSize: 0,
                              lineHeight: 0,
                              padding: 0,
                              ...({
                                msoLineHeightRule: 'exactly',
                                msoLineHeightAlt: '0px',
                                msoPaddingAlt: '0 0 0 0',
                              } as CSSProperties),
                            }}
                          >
                            {chartCellContent}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                {chartContent.trim() || chartContentHtml ? (
                  <tr>
                    <td
                      style={{
                        paddingTop: '18px',
                        paddingLeft: '16px',
                        paddingBottom: '24px',
                        color: '#495057',
                        fontFamily: EMAIL_FONT_FAMILY,
                        fontSize: '18px',
                        fontWeight: 400,
                        lineHeight: '27px',
                        ...({
                          msoAnsiFontSize: outlookMsoFontSize(12),
                          msoFareastFontSize: outlookMsoFontSize(12),
                          msoLineHeightAlt: msoLineHeightAltScaled(27, 18, 12),
                          msoLineHeightRule: 'exactly',
                          msoPaddingAlt: msoPaddingAltScaled(18, 0, 24, 16, 18, 12),
                        } as CSSProperties),
                        ...removedNonTextStyle,
                      }}
                    >
                      {chartContentHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chartContentHtml) }} />
                      ) : (
                        chartContent.split('\n').map((line, lineIdx) => (
                          <Fragment key={lineIdx}>
                            {lineIdx > 0 ? <br /> : null}
                            {line}
                          </Fragment>
                        ))
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          }
          if (block.type === 'TABLE') {
            const tableContent = String(getBlockFields<{ content?: string }>(block)?.content ?? '')
            const tableContentHtml = blockDiff?.contentDiffHtml
            return (
              <Fragment key={block.id}>
                <tr>
                  <td style={{ paddingLeft: '16px', position: 'relative', backgroundColor: addedBlockBg, ...removedNonTextStyle }}>
                    {blockDeleted && <ChangedLabel labelKind="deleted" top="12px" />}
                    {!blockDeleted && blockChangeKind && <ChangedLabel labelKind={blockChangeKind} top="12px" />}
                    <ReferenceTable tableData={tableViewFromBlock(block)} width="760" />
                  </td>
                </tr>
                {tableContent.trim() || tableContentHtml ? (
                  <tr>
                    <td
                      style={{
                        paddingTop: '18px',
                        paddingLeft: '16px',
                        paddingBottom: '24px',
                        color: '#495057',
                        fontFamily: EMAIL_FONT_FAMILY,
                        fontSize: '18px',
                        fontWeight: 400,
                        lineHeight: '27px',
                        ...({
                          msoAnsiFontSize: outlookMsoFontSize(12),
                          msoFareastFontSize: outlookMsoFontSize(12),
                          msoLineHeightAlt: msoLineHeightAltScaled(27, 18, 12),
                          msoLineHeightRule: 'exactly',
                          msoPaddingAlt: msoPaddingAltScaled(18, 0, 24, 16, 18, 12),
                        } as CSSProperties),
                        ...removedNonTextStyle,
                      }}
                    >
                      {tableContentHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tableContentHtml) }} />
                      ) : (
                        tableContent.split('\n').map((line, lineIdx) => (
                          <Fragment key={lineIdx}>
                            {lineIdx > 0 ? <br /> : null}
                            {line}
                          </Fragment>
                        ))
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          }
          if (block.type === 'IMAGE') {
            const img = getBlockFields<{ imageBase64?: string; content?: string }>(block)
            const src = String(img?.imageBase64 ?? '')
            const caption = String(img?.content ?? '')
            const imageTitle = String(block.title ?? '').trim()
            const imageTitleHtml = blockDiff?.titleDiffHtml
            const imageCaptionHtml = blockDiff?.contentDiffHtml
            if (!src && !blockDeleted && !blockChangeKind) return null
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
                  {blockDeleted && <ChangedLabel labelKind="deleted" top="12px" />}
                  {!blockDeleted && blockChangeKind && <ChangedLabel labelKind={blockChangeKind} top="12px" />}
                  <table
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="800"
                    style={{ borderCollapse: 'collapse', width: '800px', backgroundColor: addedBlockBg }}
                  >
                    <tbody>
                      {imageTitle || imageTitleHtml ? (
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
                            {...(imageTitleHtml
                              ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(imageTitleHtml) } }
                              : { children: imageTitle })}
                          />
                        </tr>
                      ) : null}
                      {src ? (
                        <tr>
                          <td
                            style={{
                              fontSize: 0,
                              lineHeight: 0,
                              padding: 0,
                              ...({
                                msoLineHeightRule: 'exactly',
                                msoLineHeightAlt: '0px',
                                msoPaddingAlt: '0 0 0 0',
                              } as CSSProperties),
                            }}
                          >
                            <img src={src} alt="" width={800} style={{ display: 'block', width: '800px', maxWidth: '100%', border: 0 }} />
                          </td>
                        </tr>
                      ) : null}
                      {caption || imageCaptionHtml ? (
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
                            {...(imageCaptionHtml
                              ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(imageCaptionHtml) } }
                              : { children: caption })}
                          />
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </td>
              </tr>
            )
          }
          if (block.type === 'TEXT') {
            const bf = getBlockFields<{ content?: string; title?: string }>(block)
            const text = String(bf?.content ?? '')
            const textTitle = String(bf?.title ?? block.title ?? '').trim()
            const hasContent = text.trim().length > 0
            if (!hasContent && !textTitle && !blockDeleted && !blockChangeKind) return null
            if (!hasContent && !textTitle && (blockDeleted || blockChangeKind)) {
              return (
                <tr key={block.id}>
                  <td style={{ position: 'relative', paddingBottom: '24px' }}>
                    <ChangedLabel labelKind={blockDeleted ? 'deleted' : blockChangeKind!} top="5px" />
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
              ...({
                msoAnsiFontSize: outlookMsoFontSize(13.5),
                msoFareastFontSize: outlookMsoFontSize(13.5),
                msoLineHeightAlt: msoLineHeightAltScaled(28, 20, 13.5),
                msoLineHeightRule: 'exactly',
              } as CSSProperties),
              opacity: blockDeleted ? 0.72 : undefined,
              textDecoration: blockDeleted ? 'line-through' : undefined,
            }
            const contentCellStyle: CSSProperties = {
              paddingBottom: '24px',
              color: '#495057',
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: '27px',
              ...({
                msoAnsiFontSize: outlookMsoFontSize(12),
                msoFareastFontSize: outlookMsoFontSize(12),
                msoLineHeightAlt: msoLineHeightAltScaled(27, 18, 12),
                msoLineHeightRule: 'exactly',
              } as CSSProperties),
              opacity: blockDeleted ? 0.72 : undefined,
              textDecoration: blockDeleted ? 'line-through' : undefined,
            }

            const blockLabel = blockDeleted ? 'deleted' : blockChangeKind
            const titleHtml = blockDiff?.titleDiffHtml
            const contentHtml = blockDiff?.contentDiffHtml
            return (
              <Fragment key={block.id}>
                {textTitle || titleHtml ? (
                  <tr>
                    <td style={{ position: 'relative', paddingBottom: hasContent ? '10px' : '24px' }}>
                      {blockLabel && <ChangedLabel labelKind={blockLabel} top="5px" />}
                      <div
                        style={titleInnerStyle}
                        {...(titleHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(titleHtml) } } : { children: textTitle })}
                      />
                    </td>
                  </tr>
                ) : null}
                {hasContent || contentHtml ? (
                  <tr>
                    <td
                      style={{
                        ...contentCellStyle,
                        ...(textTitle || titleHtml ? { paddingTop: '4px' } : {}),
                        ...({
                          msoPaddingAlt:
                            textTitle || titleHtml ? msoPaddingAltScaled(4, 0, 24, 0, 18, 12) : msoPaddingAltScaled(0, 0, 24, 0, 18, 12),
                        } as CSSProperties),
                        position: 'relative',
                      }}
                    >
                      {!textTitle && !titleHtml && blockLabel && <ChangedLabel labelKind={blockLabel} top="5px" />}
                      {contentHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }} />
                      ) : (
                        text.split('\n').map((line, lineIdx) => (
                          <Fragment key={lineIdx}>
                            {lineIdx > 0 ? <br /> : null}
                            {line}
                          </Fragment>
                        ))
                      )}
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
