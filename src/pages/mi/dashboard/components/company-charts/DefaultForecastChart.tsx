import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import { generateForecastDataset } from '@/components/common/forecast-chart/mockBrentForecastData'
import { SelectedReportChartContent } from '@/pages/mi/dashboard/components/ReportComponent'

interface DefaultForecastChartProps {
  months: string[]
  selectedContent: SelectedReportChartContent | null
  onSelectedContent: (content: SelectedReportChartContent | null) => void
}

const DefaultForecastChart = ({ months, selectedContent: _, onSelectedContent }: DefaultForecastChartProps) => (
  <MIForecastChart
    onSelectedContent={onSelectedContent}
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
        type: 'future',
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 3',
        color: '#EFA460',
        hidePoint: true,
        type: 'future',
      },
    ]}
    months={months}
    height={598}
    bottomLabel="First Unit"
    topLabel="Unit: USD/bbl"
  />
)

export default DefaultForecastChart
