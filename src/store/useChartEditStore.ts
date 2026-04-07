import { create } from 'zustand'

import { ChartType } from '@/types/dataDetailChart'

export type BoxPosition = { x: number; y: number }
export type BoxPositions = Record<number, BoxPosition>
/** 뉴스 제목 편집 내용 (timestamp → 편집된 제목 텍스트, \n 포함 가능) */
export type TitleEdits = Record<number, string>

interface ChartEditState {
  showVolumePanel: boolean
  /** 그래프 유형 + 리셋 버튼 툴바 표시 (기본: false) */
  showChartToolbar: boolean
  chartType: ChartType
  boxPositions: BoxPositions
  /** 뉴스 제목 편집 내용 (timestamp → 편집된 제목, \n으로 줄바꿈) */
  titleEdits: TitleEdits

  setShowVolumePanel: (value: boolean) => void
  setShowChartToolbar: (value: boolean) => void
  setChartType: (value: ChartType) => void
  onBoxPositionChange: (timestamp: number, position: BoxPosition) => void
  /** 스냅샷에서 불러온 위치를 일괄 설정 (편집 모드 진입 시) */
  setBoxPositions: (positions: BoxPositions) => void
  resetBoxPositions: () => void
  /** 뉴스 제목 편집 내용 저장 */
  setTitleEdit: (timestamp: number, newTitle: string) => void
  resetChartSettings: () => void
}

/** 드래그 중 mousemove 연속 호출 시 RAF로 배치하여 무한 루프 방지 */
let boxPositionRafId: number | null = null
let pendingBoxPosition: { timestamp: number; position: BoxPosition } | null = null

const useChartEditStore = create<ChartEditState>((set) => ({
  showVolumePanel: true,
  showChartToolbar: false,
  chartType: ChartType.CANDLE,
  boxPositions: {},
  titleEdits: {},

  setShowVolumePanel: (value) => set({ showVolumePanel: value }),
  setShowChartToolbar: (value) => set({ showChartToolbar: value }),
  setChartType: (value) => set({ chartType: value }),
  onBoxPositionChange: (timestamp, position) => {
    pendingBoxPosition = { timestamp, position }
    if (boxPositionRafId !== null) return

    boxPositionRafId = requestAnimationFrame(() => {
      if (pendingBoxPosition) {
        const { timestamp: ts, position: pos } = pendingBoxPosition
        set((state) => ({
          boxPositions: {
            ...state.boxPositions,
            [ts]: pos,
          },
        }))
        pendingBoxPosition = null
      }
      boxPositionRafId = null
    })
  },
  setBoxPositions: (positions) => set({ boxPositions: positions }),
  resetBoxPositions: () => set({ boxPositions: {}, titleEdits: {} }),
  setTitleEdit: (timestamp, newTitle) => {
    set((state) => ({
      titleEdits: {
        ...state.titleEdits,
        [timestamp]: newTitle,
      },
    }))
  },
  resetChartSettings: () =>
    set({
      showVolumePanel: true,
      showChartToolbar: false,
      chartType: ChartType.CANDLE,
      boxPositions: {},
      titleEdits: {},
    }),
}))

export default useChartEditStore
