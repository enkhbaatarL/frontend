import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import ReferenceChart, { ReferenceChartRef } from '@/pages/mi/newsletter/components/chart/ReferenceChart'
import { IReferenceDataItem } from '@/service/mi/newsletter'

interface Props {
  referenceData: IReferenceDataItem[]
  marketOpenTime?: number
  marketCloseTime?: number
}

const Reference = ({ referenceData, marketOpenTime, marketCloseTime }: Props) => {
  const { t } = useTranslation()
  const chartRef = useRef<ReferenceChartRef | null>(null)

  return referenceData.map((item) => (
    <table
      style={{
        width: '800px',
        margin: '0 auto 20px auto',
        padding: '0 12px',
      }}
      key={item.title}
    >
      <thead>
        <tr>
          <th>
            <table
              style={{
                width: '776px',
                margin: '0 auto',
              }}
            >
              <thead>
                <tr>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#212529',
                    }}
                  >
                    {t('newsletter.detail.reference')}
                  </td>
                </tr>
                <tr>
                  <th colSpan={2} style={{ width: '100%', height: '12px', borderBottom: '1px solid #868E96' }}></th>
                </tr>
              </tbody>
            </table>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <table
              style={{
                width: '776px',
                margin: '0 auto',
              }}
            >
              <thead>
                <tr>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <table width="100%">
                      <thead>
                        <tr>
                          <th style={{ padding: '4px 0', textAlign: 'left', fontWeight: 700, fontSize: '18px', color: '#212529' }}>
                            {item.title}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 400, fontSize: '14px', color: '#495057', whiteSpace: 'pre-line' }}>
                            {item.description}
                          </td>
                        </tr>
                        <tr>
                          <td width="100%" style={{ padding: '24px 0' }}>
                            {item.chartData && (
                              <table width="100%" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>
                                      <ReferenceChart
                                        ref={chartRef}
                                        chartData={item.chartData}
                                        marketOpenTime={marketOpenTime}
                                        marketCloseTime={marketCloseTime}
                                      />
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            )}
                            {item.tableData && (
                              <table width="100%" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    {item.tableData.headers.map((header, index) => (
                                      <th
                                        key={header.field}
                                        style={{
                                          padding: '9px 12px',
                                          textAlign: index === 0 ? 'center' : 'right',
                                          whiteSpace: 'pre-line',
                                          color: '#868E96',
                                          backgroundColor: '#F8F9FA',
                                          borderBottom: '1px solid #CED4DA',
                                          fontWeight: 600,
                                          fontSize: '13px',
                                        }}
                                      >
                                        {header.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.tableData.rows.map((row) => (
                                    <tr key={row.cells.join(',')}>
                                      {row.cells.map((cell, index) => (
                                        <td
                                          key={cell}
                                          style={{
                                            padding: '9px 12px',
                                            textAlign: index === 0 ? 'center' : 'right',
                                            whiteSpace: 'pre-line',
                                            backgroundColor: index === 0 || index === 4 ? '#F8F9FA' : undefined,
                                            borderBottom: '1px solid #DEE2E6',
                                            fontWeight: 400,
                                            fontSize: '14px',
                                            color: '#212529',
                                          }}
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
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
  ))
}

export default Reference
