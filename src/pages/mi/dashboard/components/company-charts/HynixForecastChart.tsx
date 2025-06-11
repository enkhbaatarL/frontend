import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import { generateForecastDataset } from '@/components/common/forecast-chart/mockBrentForecastData'
import { SelectedReportChartContent } from '@/pages/mi/dashboard/components/ReportComponent'

interface HynixForecastChartProps {
  months: string[]
  selectedContent: SelectedReportChartContent | null
  onSelectedContent: (content: SelectedReportChartContent | null) => void
}

const HynixForecastChart = ({ months, selectedContent: _, onSelectedContent }: HynixForecastChartProps) => (
  <MIForecastChart
    onSelectedContent={onSelectedContent}
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
        type: 'FUTURE',
      },
      {
        ...generateForecastDataset(months),
        label: 'Industry Forecast',
        color: '#FB8C00',
        hidePoint: true,
        type: 'FUTURE',
      },
    ]}
    months={months}
    height={598}
    bottomLabel="Memory Price Unit"
    topLabel="Unit: USD/GB"
  />
)

export default HynixForecastChart
