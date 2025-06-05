import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import { generateForecastDataset } from '@/components/common/forecast-chart/mockBrentForecastData'

interface DefaultForecastChartProps {
  months: string[]
  onViewDetail: (content: { label?: string; value?: number; category?: string; color?: string }, label: string) => void
}

const DefaultForecastChart = ({ months, onViewDetail }: DefaultForecastChartProps) => (
  <MIForecastChart
    onViewDetail={onViewDetail}
    forecastDatasets={[
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Actual data 1',
        color: '#40597A',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 2',
        color: '#26757B',
        hidePoint: true,
        type: 'FUTURE',
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 3',
        color: '#EFA460',
        hidePoint: true,
        type: 'FUTURE',
      },
    ]}
    months={months}
    height={598}
    bottomLabel="First Unit"
    topLabel="Unit: USD/bbl"
  />
)

export default DefaultForecastChart
