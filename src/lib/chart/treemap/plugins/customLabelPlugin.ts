import { Chart as ChartJS, ChartDataset } from 'chart.js'

interface TreemapDataItem {
  _data: {
    children: {
      sector: string
      level: number
      change: number
    }[]
  }
}

const customLabelPlugin = {
  id: 'customLabelPlugin',
  // beforeTooltipDraw 대신 afterDatasetsDraw 사용 (항상 라벨이 표시되도록)
  afterDatasetsDraw: (chart: ChartJS) => {
    const ctx = chart.ctx
    const dataset = chart.data.datasets[0] as ChartDataset<'treemap', TreemapDataItem[]>

    if (!dataset?.data) return

    dataset.data.forEach((item: TreemapDataItem, i: number) => {
      const rect = chart.getDatasetMeta(0).data[i]

      if (!rect) return

      const data = item._data.children[0]
      if (!data?.sector) return

      const { x, y, width: w, height: h } = rect as unknown as { x: number; y: number; width: number; height: number }

      // 레벨에 따른 폰트 크기 결정 (사각형 크기와 무관하게)
      const level = data.level || 1

      // 레벨에 따라 폰트 크기 직접 결정 (사각형 크기에 비례하지 않음)
      const baseTitleSize = 10
      const baseChangeSize = 14

      // 레벨별 고정 폰트 크기 설정
      const titleFontSize = baseTitleSize + (level - 1) * 0.3
      const changeFontSize = baseChangeSize + (level - 1) * 0.4

      const paddingX = 18
      const paddingY = 18

      ctx.save()

      // 텍스트가 영역을 벗어나지 않도록 일립시스 처리하는 함수
      const drawTextWithEllipsis = (
        text: string,
        xPos: number,
        yPos: number,
        maxWidth: number,
        fontSize: number,
        isBold: boolean = false,
      ) => {
        const fontWeight = isBold ? 'bold' : 'normal'
        ctx.font = `${fontWeight} ${fontSize}px Arial`

        const textWidth = ctx.measureText(text).width

        const textHeight = fontSize * 1.2

        // 사각형 높이보다 텍스트 높이가 크면 표시하지 않음
        if (textHeight > h - paddingY * 2) {
          return null
        }

        // 텍스트가 영역 내에 들어가는 경우
        if (textWidth <= maxWidth - paddingX * 2) {
          ctx.fillText(text, xPos, yPos)
          return text
        }

        let ellipsisText = text
        const ellipsis = '...'
        const ellipsisWidth = ctx.measureText(ellipsis).width

        // ...만 표시하는 경우
        if (ellipsisWidth + 10 > maxWidth - paddingX * 2) {
          return null
        }

        // 텍스트가 maxWidth에 맞도록 자르기
        while (ctx.measureText(ellipsisText + ellipsis).width > maxWidth - paddingX * 2 && ellipsisText.length > 0) {
          ellipsisText = ellipsisText.substring(0, ellipsisText.length - 1)
        }

        // 텍스트를 모두 자르고도 공간이 부족한 경우
        if (ellipsisText.length === 0) {
          return null
        }

        ctx.fillText(ellipsisText + ellipsis, xPos, yPos)

        return ellipsisText + ellipsis
      }

      // 섹터명 (상단)
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const sectorText = drawTextWithEllipsis(data.sector, x + paddingX, y + paddingY, w, titleFontSize, false)

      if (sectorText === null) {
        return
      }

      // 변화율 (하단)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      drawTextWithEllipsis(
        data.change.toFixed(2).replace('-', '- '),
        x + paddingX,
        y + paddingY + titleFontSize + 8,
        w,
        changeFontSize,
        true,
      )

      ctx.restore()
    })
  },
}

export default customLabelPlugin
