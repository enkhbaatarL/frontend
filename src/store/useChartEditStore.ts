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
  /** React 리렌더 없이 드래그 중 최신 좌표만 갱신 */
  setLiveBoxPosition: (timestamp: number, position: BoxPosition) => void
  /** 드래그 종료 시 최신 좌표를 구독 상태에 반영 */
  commitLiveBoxPositions: () => void
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
let latestBoxPositions: BoxPositions = {}

export const getLatestChartBoxPositions = () => latestBoxPositions

const mergeLatestBoxPosition = (timestamp: number, position: BoxPosition) => {
  const currentPosition = latestBoxPositions[timestamp]
  if (currentPosition?.x === position.x && currentPosition?.y === position.y) return
  latestBoxPositions[timestamp] = position
}

const replaceLatestBoxPositions = (positions: BoxPositions) => {
  latestBoxPositions = { ...positions }
}

const cancelPendingBoxPositionCommit = () => {
  if (boxPositionRafId !== null) {
    cancelAnimationFrame(boxPositionRafId)
    boxPositionRafId = null
  }
  pendingBoxPosition = null
}

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
    mergeLatestBoxPosition(timestamp, position)
    pendingBoxPosition = { timestamp, position }
    if (boxPositionRafId !== null) return

    boxPositionRafId = requestAnimationFrame(() => {
      if (pendingBoxPosition) {
        set((state) => ({
          boxPositions: {
            ...state.boxPositions,
            ...latestBoxPositions,
          },
        }))
        pendingBoxPosition = null
      }
      boxPositionRafId = null
    })
  },
  setLiveBoxPosition: (timestamp, position) => {
    mergeLatestBoxPosition(timestamp, position)
  },
  commitLiveBoxPositions: () => set({ boxPositions: { ...latestBoxPositions } }),
  setBoxPositions: (positions) => {
    cancelPendingBoxPositionCommit()
    replaceLatestBoxPositions(positions)
    set({ boxPositions: positions })
  },
  resetBoxPositions: () => {
    cancelPendingBoxPositionCommit()
    replaceLatestBoxPositions({})
    set({ boxPositions: {}, titleEdits: {} })
  },
  setTitleEdit: (timestamp, newTitle) => {
    set((state) => ({
      titleEdits: {
        ...state.titleEdits,
        [timestamp]: newTitle,
      },
    }))
  },
  resetChartSettings: () => {
    cancelPendingBoxPositionCommit()
    replaceLatestBoxPositions({})
    set({
      showVolumePanel: true,
      showChartToolbar: false,
      chartType: ChartType.CANDLE,
      boxPositions: {},
      titleEdits: {},
    })
  },
}))

export default useChartEditStore
