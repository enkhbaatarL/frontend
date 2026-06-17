import { Stack } from '@mui/material'
import { useState } from 'react'

import type { ScenarioGroupGraphPeriodUnit } from '@/service/mi/nextGenMI/scenarioGroup'
import type { RefObject } from 'react'

import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import DataSheetIcon from '@/components/common/icons/DataSheetIcon'
import GraphImageIcon from '@/components/common/icons/GraphImageIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'
import { downloadChart } from '@/utils/chartDownload'
import { downloadFile } from '@/utils/file'

interface ScenarioGroupGraphDownloadMenuProps {
  scenarioGroupId: number
  indexName: string
  periodUnit: ScenarioGroupGraphPeriodUnit
  chartRef: RefObject<HTMLElement | null>
}

const ScenarioGroupGraphDownloadMenu = ({ scenarioGroupId, indexName, periodUnit, chartRef }: ScenarioGroupGraphDownloadMenuProps) => {
  const [open, setOpen] = useState(false)

  const handleExcelDownload = async () => {
    try {
      const response = await nextGenMIScenarioGroupService.exportScenarioGroupGraph(scenarioGroupId, periodUnit)
      const contentDisposition = response.headers?.['content-disposition'] ?? ''
      const fileNameFromHeader = contentDisposition.split('\'\'').pop()?.trim()
      downloadFile(response.data, fileNameFromHeader || `scenario-group-${scenarioGroupId}-${periodUnit}-graph.xlsx`)
    } catch (error) {
      console.error('시나리오 그룹 그래프 데이터 시트 다운로드 실패:', error)
    }
  }

  const handleImageDownload = () => {
    const target = chartRef.current
    if (!target) return
    downloadChart({ filename: `scenario-group-${scenarioGroupId}-${indexName}-${periodUnit}.png`, target, padding: 20 })
  }

  return (
    <MIDropdownMenu
      variant="outlined"
      open={open}
      onOpenChange={setOpen}
      closeOnScroll
      placement="bottom-end"
      groupDisplayType="none"
      paperProps={{ sx: { minWidth: '180px' } }}
      sx={{
        width: '36px',
        minWidth: '36px',
        height: '36px',
        padding: '0',
        justifyContent: 'center',
        borderRadius: '8px',
        borderColor: 'contentBorder.Active',
        backgroundColor: 'gray.5',
        '&:hover:not(:disabled)': { backgroundColor: 'gray.10', borderColor: 'contentBorder.Active' },
        '& .MuiStack-root': { justifyContent: 'center' },
      }}
      label={
        <Stack alignItems="center" justifyContent="center" width="100%" height="20px">
          <ChartDownloadIcon />
        </Stack>
      }
      items={[
        {
          label: (
            <Stack component="span" direction="row" alignItems="center" gap="8px">
              <DataSheetIcon />
              데이터 시트 (.xlsx)
            </Stack>
          ),
          action: handleExcelDownload,
        },
        {
          label: (
            <Stack component="span" direction="row" alignItems="center" gap="8px">
              <GraphImageIcon />
              그래프 이미지 (.png)
            </Stack>
          ),
          action: handleImageDownload,
        },
      ]}
    />
  )
}

export default ScenarioGroupGraphDownloadMenu
