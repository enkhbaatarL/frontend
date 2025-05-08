export interface FilterOption {
  label: string
  value: string
}

export interface FilterSection {
  title: string
  options: FilterOption[]
}

export const mockFilters: FilterSection[] = [
  {
    title: 'Document Types',
    options: [
      { label: 'Insight', value: 'insight' },
      { label: 'Commodity Market Report', value: 'commodity_market_report' },
      { label: 'Company Report', value: 'company_report' },
      { label: 'Asset Report', value: 'asset_report' },
      { label: 'Deal Insight', value: 'deal_insight' },
      { label: 'Inform', value: 'inform' },
      {
        label: 'Commodity Maket Report Commodity Maket Report',
        value: 'commodity_maket_report_repeat',
      },
    ],
  },
  {
    title: 'Providers',
    options: [
      { label: 'LSEG (Former Refinitiv)', value: 'lseg' },
      { label: 'Wood Mackenzie', value: 'wood_mackenzie' },
    ],
  },
  {
    title: 'Languages',
    options: [
      { label: 'English', value: 'en' },
      { label: 'Korean', value: 'ko' },
    ],
  },
]
