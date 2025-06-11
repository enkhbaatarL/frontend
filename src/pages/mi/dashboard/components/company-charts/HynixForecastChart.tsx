import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import { generateForecastDataset } from '@/components/common/forecast-chart/mockBrentForecastData'

interface HynixForecastChartProps {
  months: string[]
  onViewDetail: (content: { label?: string; value?: number; category?: string; color?: string }, label: string) => void
}

const HynixForecastChart = ({ months, onViewDetail }: HynixForecastChartProps) => (
  <MIForecastChart
    onViewDetail={onViewDetail}
    forecastDatasets={[
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Hynix Memory Price',
        color: '#1E88E5',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months),
        label: 'Market Average',
        color: '#43A047',
        hidePoint: true,
        type: 'future',
      },
      {
        ...generateForecastDataset(months),
        label: 'Industry Forecast',
        color: '#FB8C00',
        hidePoint: true,
        type: 'future',
      },
    ]}
    months={months}
    height={598}
    bottomLabel="Memory Price Unit"
    topLabel="Unit: USD/GB"
  />
)

export default HynixForecastChart
