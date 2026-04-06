import DOMPurify from 'dompurify'
import { CSSProperties } from 'react'

import ChangedLabel from '@/pages/mi/newsletter/components/view/ChangedLabel'
import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled } from '@/utils/email'
import { formatPriceForDisplay, oilChangePresentation } from '@/utils/titleOilPriceDisplay'

const DEFAULT_OIL_LABEL = 'Brent Crude'

/** 이메일 HTML 내 유가 행 캡처 이미지 표시 높이 (브라우저·Outlook 공통) */
export const OIL_PRICE_ROW_EMAIL_IMAGE_HEIGHT_PX = 28

export type TitleOilPriceRowEmailTableProps = {
  oilPriceLabel?: string
  priceChangeFrom: number
  priceChangeTo: number
}

/** borderRadius 등 Outlook 비호환 스타일 — 캡처·이메일 폴백용 테이블 마크업 */
export const TitleOilPriceRowEmailTable = ({
  oilPriceLabel = DEFAULT_OIL_LABEL,
  priceChangeFrom,
  priceChangeTo,
}: TitleOilPriceRowEmailTableProps) => {
  const oilPresentation = oilChangePresentation(priceChangeFrom, priceChangeTo)
  return (
    <table cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td
            style={{
              backgroundColor: '#dee2e6',
              borderRadius: '10px',
              padding: '4px 10px',
              verticalAlign: 'middle',
            }}
          >
            <span
              style={{
                color: '#212529',
                fontFamily: EMAIL_FONT_FAMILY,
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '20px',
              }}
            >
              {oilPriceLabel}
            </span>
          </td>
          <td style={{ width: '12px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
          <td style={{ verticalAlign: 'middle' }}>
            <table cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      color: '#212529',
                      fontFamily: EMAIL_FONT_FAMILY,
                      fontSize: '20px',
                      fontWeight: 600,
                      lineHeight: '28px',
                    }}
                  >
                    {formatPriceForDisplay(priceChangeFrom)}
                  </td>
                  <td
                    style={{
                      paddingLeft: '4px',
                      color: '#212529',
                      fontFamily: EMAIL_FONT_FAMILY,
                      fontSize: '20px',
                      fontWeight: 600,
                      lineHeight: '28px',
                    }}
                  >
                    →
                  </td>
                  <td
                    style={{
                      paddingLeft: '4px',
                      color: '#212529',
                      fontFamily: EMAIL_FONT_FAMILY,
                      fontSize: '20px',
                      fontWeight: 600,
                      lineHeight: '28px',
                    }}
                  >
                    {formatPriceForDisplay(priceChangeTo)}
                  </td>
                  <td
                    style={{
                      paddingLeft: '4px',
                      color: oilPresentation.isPositive ? '#498b47' : '#dc3545',
                      fontFamily: EMAIL_FONT_FAMILY,
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '22px',
                    }}
                  >
                    {oilPresentation.changeText}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

interface TitleAndOilPriceProps {
  title: string
  subtitle: string
  /** Title 섹션 fields.priceChangeFrom — 둘 다 있을 때만 유가 행 표시 */
  priceChangeFrom?: number
  priceChangeTo?: number
  oilPriceLabel?: string
  /** `renderEmailContent` 등 이메일 HTML 전용 — 있으면 테이블 대신 이미지 */
  oilPriceRowImage?: string
  titleDiffHtml?: string
  subtitleDiffHtml?: string
  oilPriceRowDiffHtml?: string
}

const TitleAndOilPrice = ({
  title,
  subtitle,
  priceChangeFrom,
  priceChangeTo,
  oilPriceLabel = DEFAULT_OIL_LABEL,
  oilPriceRowImage,
  titleDiffHtml,
  subtitleDiffHtml,
  oilPriceRowDiffHtml,
}: TitleAndOilPriceProps) => {
  const showOilRow =
    priceChangeFrom !== undefined && priceChangeTo !== undefined && Number.isFinite(priceChangeFrom) && Number.isFinite(priceChangeTo)

  const oilPresentation =
    showOilRow && priceChangeFrom !== undefined && priceChangeTo !== undefined
      ? oilChangePresentation(priceChangeFrom, priceChangeTo)
      : null

  return (
    <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ paddingTop: '12px' }}>
            <table
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              style={{
                borderCollapse: 'collapse',
                borderTop: '2px solid #000',
                borderBottom: '2px solid #000',
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: '24px 0 0 0',
                      color: '#212529',
                      fontFamily: EMAIL_FONT_FAMILY,
                      fontSize: '28px',
                      fontWeight: 700,
                      lineHeight: '39px',
                      ...({
                        msoAnsiFontSize: '18px',
                        msoFareastFontSize: '18px',
                        msoLineHeightAlt: msoLineHeightAltScaled(39, 28, 18),
                        msoLineHeightRule: 'exactly',
                      } as CSSProperties),
                    }}
                    {...(titleDiffHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(titleDiffHtml) } } : { children: title })}
                  />
                </tr>
                {(subtitle || subtitleDiffHtml) && (
                  <tr>
                    <td
                      style={{
                        padding: `8px 0 ${showOilRow || oilPriceRowDiffHtml ? '12px' : '24px'} 0`,
                        color: '#495057',
                        fontFamily: EMAIL_FONT_FAMILY,
                        fontSize: '20px',
                        fontWeight: 500,
                        lineHeight: '28px',
                      }}
                      {...(subtitleDiffHtml
                        ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(subtitleDiffHtml) } }
                        : { children: subtitle })}
                    />
                  </tr>
                )}
                {oilPriceRowDiffHtml && !showOilRow && (
                  <tr>
                    <td style={{ padding: '0 0 24px 0', position: 'relative' }}>
                      <ChangedLabel diffHtmls={[oilPriceRowDiffHtml]} top="0px" />
                    </td>
                  </tr>
                )}
                {showOilRow && oilPresentation && priceChangeFrom !== undefined && priceChangeTo !== undefined && (
                  <tr>
                    <td
                      style={{
                        padding: `${subtitle || subtitleDiffHtml ? 0 : 12}px 0 24px 0`,
                        verticalAlign: 'top',
                        position: 'relative',
                      }}
                    >
                      {oilPriceRowDiffHtml && <ChangedLabel diffHtmls={[oilPriceRowDiffHtml]} top="0px" />}
                      {oilPriceRowImage ? (
                        <img
                          src={oilPriceRowImage}
                          alt=""
                          height={OIL_PRICE_ROW_EMAIL_IMAGE_HEIGHT_PX}
                          style={{
                            display: 'block',
                            border: 0,
                            outline: 'none',
                            height: `${OIL_PRICE_ROW_EMAIL_IMAGE_HEIGHT_PX}px`,
                            width: 'auto',
                            maxWidth: '800px',
                          }}
                        />
                      ) : (
                        <TitleOilPriceRowEmailTable
                          oilPriceLabel={oilPriceLabel}
                          priceChangeFrom={priceChangeFrom}
                          priceChangeTo={priceChangeTo}
                        />
                      )}
                    </td>
                  </tr>
                )}
                {!subtitle && !subtitleDiffHtml && !showOilRow && !oilPriceRowDiffHtml && (
                  <tr>
                    <td style={{ paddingBottom: '24px', fontSize: '0', lineHeight: '0' }}>&nbsp;</td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default TitleAndOilPrice
