import { RefObject } from 'react'

import InflectionPointChart, { InflectionPointChartRef } from '../chart/InflectionPointChart'

import { INewsFlowChartData, IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'

interface Props {
  title: string
  basis: string
  chartData?: INewsFlowChartData
  relatedNews?: IRelatedNewsEventItem[]
  mode: NewsletterDetailPageMode
  chartRef?: RefObject<InflectionPointChartRef | null>
  marketOpenTime?: number
  marketCloseTime?: number
}

const Chart = ({ title, basis, chartData, relatedNews, mode, chartRef, marketOpenTime, marketCloseTime }: Props) => (
  <table
    style={{
      width: '800px',
      margin: '30px auto 20px auto',
      padding: '0 12px',
    }}
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
                  {title}
                </td>
                <td
                  style={{
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    fontWeight: 400,
                    fontSize: '12px',
                    color: '#868E96',
                  }}
                >
                  {basis}
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
        <td style={{ padding: '24px 0', width: '100%' }}>
          {chartData && (
            <InflectionPointChart
              ref={chartRef}
              chartData={chartData}
              relatedNews={relatedNews}
              mode={mode}
              marketOpenTime={marketOpenTime}
              marketCloseTime={marketCloseTime}
            />
          )}
        </td>
      </tr>
    </tbody>
  </table>
)

export default Chart
