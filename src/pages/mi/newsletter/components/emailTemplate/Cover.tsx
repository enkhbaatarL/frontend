import DOMPurify from 'dompurify'

import { EMAIL_FONT_FAMILY } from '@/utils/email'

interface CoverProps {
  image: string
  frequency: string
  name: string
  description: string
  coverImage?: string
  /** false이면 인라인 커버 썸네일(145px) 비노출 — API `COVER_IMAGE_CARD.fields.showImage` */
  showImage?: boolean
  nameDiffHtml?: string
  descriptionDiffHtml?: string
}

const Cover = ({ image, frequency, name, description, coverImage, showImage = true, nameDiffHtml, descriptionDiffHtml }: CoverProps) => {
  if (coverImage) {
    return <img src={coverImage} alt="cover" width={800} style={{ display: 'block', width: '800px', border: 0, outline: 'none' }} />
  }

  return (
    <table
      width="800"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{
        width: '800px',
        backgroundColor: '#F1F3F5',
        borderCollapse: 'collapse',
        borderRadius: '10px',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '24px' }}>
            <table width="752" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  {showImage && image ? (
                    <td style={{ width: '145px', verticalAlign: 'top' }}>
                      <img
                        src={image}
                        alt="cover"
                        width={145}
                        height={97}
                        style={{
                          display: 'block',
                          width: '145px',
                          height: '97px',
                          borderRadius: '6px',
                          border: '0.5px solid #868E96',
                        }}
                      />
                    </td>
                  ) : null}
                  <td
                    style={{
                      verticalAlign: 'top',
                      paddingLeft: showImage && image ? '24px' : 0,
                    }}
                  >
                    <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ paddingBottom: '12px' }}>
                            <table cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '100px',
                                      backgroundColor: '#DEE2E6',
                                      color: '#000',
                                      fontFamily: EMAIL_FONT_FAMILY,
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      lineHeight: '20px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {frequency}
                                  </td>
                                  <td style={{ width: '8px', fontSize: '0', lineHeight: '0' }}>&nbsp;</td>
                                  <td
                                    style={{
                                      color: '#212529',
                                      fontFamily: EMAIL_FONT_FAMILY,
                                      fontSize: '20px',
                                      fontWeight: 600,
                                      lineHeight: '28px',
                                    }}
                                    {...(nameDiffHtml
                                      ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(nameDiffHtml) } }
                                      : { children: name })}
                                  />
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              color: '#495057',
                              fontFamily: EMAIL_FONT_FAMILY,
                              fontSize: '14px',
                              fontWeight: 500,
                              lineHeight: '20px',
                            }}
                            {...(descriptionDiffHtml
                              ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(descriptionDiffHtml) } }
                              : { children: description })}
                          />
                        </tr>
                      </tbody>
                    </table>
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

export default Cover
