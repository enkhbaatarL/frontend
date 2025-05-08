// useMockReports.ts

export type ReportType = 'Commodity Market Report' | 'Insight' | 'Asset Report' | 'Deal Insight'

export interface Report {
  type: ReportType
  title: string
  subtitle: string
  date: string
  source: string
}

const mockReports: Report[] = [
  {
    type: 'Commodity Market Report',
    title: 'Turkey - Gedik Investment -  Model Portfolio Update: Removing Kardemir, Including Turkish Airlines\n',
    subtitle: 'Removing Kardemir, Including Turkish Airlines...',
    date: '25 Mar 2025',
    source: 'LSEG',
  },
  {
    type: 'Insight',
    title: 'Asia-Pacific upstream in brief',
    subtitle: 'Regional analysis and key trends',
    date: '25 Mar 2025',
    source: 'Wood Mackenzie',
  },
  {
    type: 'Insight',
    title: 'C&F Financial Corporation',
    subtitle: 'Quarterly performance snapshot',
    date: '25 Mar 2025',
    source: 'LSEG',
  },
  {
    type: 'Asset Report',
    title: 'Moheshkhali FSRU - LNG regas terminal',
    subtitle: 'Infrastructure overview and operational status',
    date: '25 Mar 2025',
    source: 'Wood Mackenzie',
  },
  {
    type: 'Deal Insight',
    title: 'ConocoPhillips sells GoA assets to Shell for US$735 million',
    subtitle: 'Deal valued at US$735 million',
    date: '25 Mar 2025',
    source: 'LSEG',
  },
  {
    type: 'Commodity Market Report',
    title: 'Global products market weekly: Unplanned outages...',
    subtitle: 'Unplanned outages and market reaction',
    date: '25 Mar 2025',
    source: 'Wood Mackenzie',
  },
  {
    type: 'Insight',
    title: 'QEPC-US Company reports financial results for the quar...',
    subtitle: 'Quarterly report highlights and analysis',
    date: '25 Mar 2025',
    source: 'LSEG',
  },
  {
    type: 'Insight',
    title: 'LND-US Company reports financial results',
    subtitle: 'Insights into revenue and performance',
    date: '25 Mar 2025',
    source: 'LSEG',
  },
]

export const useMockReports = () => mockReports
