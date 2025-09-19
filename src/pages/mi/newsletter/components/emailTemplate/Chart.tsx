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
}

const Chart = ({ title, basis, chartData, relatedNews, mode, chartRef }: Props) => (
  <table
    style={{
      width: '776px',
      margin: '30px auto 20px auto',
    }}
  >
    <thead>
      <tr>
        <th
          style={{
            width: '100%',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '18px',
            color: '#212529',
          }}
        >
          {title}
        </th>
        <th
          style={{
            whiteSpace: 'nowrap',
            textAlign: 'right',
            fontWeight: 400,
            fontSize: '12px',
            color: '#868E96',
          }}
        >
          {basis}
        </th>
      </tr>
      <tr>
        <th colSpan={2} style={{ width: '100%', height: '12px', borderBottom: '1px solid #868E96' }}></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colSpan={2} style={{ padding: '24px 0', width: '100%' }}>
          {chartData && <InflectionPointChart ref={chartRef} chartData={chartData} relatedNews={relatedNews} mode={mode} />}
        </td>
      </tr>
    </tbody>
  </table>
)

export default Chart
