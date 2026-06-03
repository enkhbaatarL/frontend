import type {
  INextGenMIEventDetailRes,
  INextGenMIEventInstitutionOutlook,
  INextGenMIEventRelatedRecord,
} from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import {
  buildMockEventDetail,
  MOCK_EVENT_INSTITUTION_OUTLOOKS,
  MOCK_EVENT_MI_RECORDS,
} from '@/pages/mi/nextGenMI/nextGenMIEventDetailMockData'

const toPagination = <T>(rows: T[], page: number, size: number): IPaginationResponse<T> => {
  const resolvedPage = page > 0 ? page : 1
  const resolvedSize = size > 0 ? size : 20
  const start = (resolvedPage - 1) * resolvedSize
  const detail = rows.slice(start, start + resolvedSize)
  const totalElements = rows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / resolvedSize))
  return {
    detail,
    totalElements,
    totalPages,
    currentPage: resolvedPage,
    numberOfElements: detail.length,
    size: resolvedSize,
    isFirst: resolvedPage === 1,
    isLast: resolvedPage >= totalPages,
    hasPrevious: resolvedPage > 1,
    hasNext: resolvedPage < totalPages,
  }
}

export const nextGenMIMockApi = {
  getEventDetail(eventId: string, eventName?: string): INextGenMIEventDetailRes {
    return buildMockEventDetail(eventId, eventName)
  },

  getEventRecords(_eventId: string, params?: { page?: number; size?: number }): IPaginationResponse<INextGenMIEventRelatedRecord> {
    return toPagination(MOCK_EVENT_MI_RECORDS, params?.page ?? 1, params?.size ?? 10)
  },

  getEventOutlooks(_eventId: string, params?: { page?: number; size?: number }): IPaginationResponse<INextGenMIEventInstitutionOutlook> {
    return toPagination(MOCK_EVENT_INSTITUTION_OUTLOOKS, params?.page ?? 1, params?.size ?? 10)
  },
}
