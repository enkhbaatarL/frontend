import type { EventDesignAvailability, EventListItem, EventScenarioDesignStatus } from '@/service/mi/nextGenMI/event'

export const normalizeEventScenarioDesignStatus = (
  status?: EventScenarioDesignStatus | string | null,
): EventScenarioDesignStatus | undefined => {
  const normalized = status?.toLowerCase()
  if (normalized === 'designable' || normalized === 'creating' || normalized === 'created') return normalized
  return undefined
}

export const findEventDesignAvailability = (
  availabilities: EventDesignAvailability[] | undefined,
  eventId: number | null,
): EventDesignAvailability | undefined => {
  if (eventId === null) return availabilities?.[0]
  return availabilities?.find((item) => item.eventId === eventId) ?? availabilities?.[0]
}

export const isOwnEventDesignAvailability = (availability: EventDesignAvailability | undefined, currentUserNo: number | null | undefined) =>
  currentUserNo !== undefined &&
  currentUserNo !== null &&
  availability?.occupantUserId !== undefined &&
  availability.occupantUserId !== null &&
  availability.occupantUserId === currentUserNo

export const isEventDesignOccupiedByOther = (
  availability: EventDesignAvailability | undefined,
  currentUserNo: number | null | undefined,
) => {
  if (!availability || isOwnEventDesignAvailability(availability, currentUserNo)) return false
  return normalizeEventScenarioDesignStatus(availability.scenarioDesignStatus) === 'creating' || availability.occupied === true
}

export const mergeEventListItemDesignAvailability = (
  row: EventListItem,
  availability: EventDesignAvailability | undefined,
): EventListItem => {
  if (!availability) return row

  return {
    ...row,
    scenarioDesignStatus: normalizeEventScenarioDesignStatus(availability.scenarioDesignStatus) ?? row.scenarioDesignStatus,
    scenarioDesignStatusLabel: availability.scenarioDesignStatusLabel ?? row.scenarioDesignStatusLabel,
    scenarioGroupId: availability.scenarioGroupId ?? row.scenarioGroupId,
    occupied: availability.occupied ?? row.occupied,
    occupantUserId: availability.occupantUserId ?? row.occupantUserId,
  }
}
