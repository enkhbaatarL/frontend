import type { IMenuNode } from '@/service/mi/companies'
import type { ComponentType } from 'react'

import { getMiMenuGroupLabel, getMiMenuItemDef, getMiMenuTopLabel, toMiLocationPath } from '@/constants/miScreenElementNav'

const getDirectNavigablePath = (node: IMenuNode): string | undefined => {
  if (node.typeCd !== 'MENU_ITEM' && node.typeCd !== 'MENU_TOP') return undefined

  const path = getMiMenuItemDef(node.screenElementCd)?.path
  return path ? toMiLocationPath(path) : undefined
}

export type MiGnbSubmenuRow =
  | { kind: 'section'; title: string }
  | {
      kind: 'item'
      screenElementCd: string
      label: string
      to: string
      desc?: string
      IconComponent?: ComponentType
    }

export interface MiGnbTopMenu {
  key: string
  screenElementCd: string
  topLabel: string
  defaultPath: string
  rows: MiGnbSubmenuRow[]
}

export const isScreenElementInCompanyMenus = (nodes: IMenuNode[] | undefined, screenElementCd: string): boolean => {
  if (!nodes?.length) return false
  for (const n of nodes) {
    if (n.screenElementCd === screenElementCd && getDirectNavigablePath(n)) return true
    if (isScreenElementInCompanyMenus(n.children ?? [], screenElementCd)) return true
  }
  return false
}

const firstLeafPath = (nodes: IMenuNode[] | undefined): string | undefined => {
  if (!nodes?.length) return undefined
  for (const n of nodes) {
    const directPath = getDirectNavigablePath(n)
    if (n.typeCd === 'MENU_ITEM' && directPath) return directPath

    const inner = firstLeafPath(n.children ?? [])
    if (inner) return inner

    if (n.typeCd === 'MENU_TOP' && directPath) return directPath
  }
  return undefined
}

const buildSubmenuRows = (children: IMenuNode[] | undefined): MiGnbSubmenuRow[] => {
  if (!children?.length) return []
  const rows: MiGnbSubmenuRow[] = []

  const pushItem = (screenElementCd: string, def: NonNullable<ReturnType<typeof getMiMenuItemDef>>) => {
    rows.push({
      kind: 'item',
      screenElementCd,
      label: def.label,
      to: toMiLocationPath(def.path),
      desc: def.desc,
      IconComponent: def.IconComponent,
    })
  }

  for (const n of children) {
    if (n.typeCd === 'MENU_GROUP') {
      const groupTitle = getMiMenuGroupLabel(n.screenElementCd)
      if (groupTitle) {
        rows.push({ kind: 'section', title: groupTitle })
      }
      for (const c of n.children ?? []) {
        if (c.typeCd === 'MENU_ITEM') {
          const def = getMiMenuItemDef(c.screenElementCd)
          if (def?.path) {
            pushItem(c.screenElementCd, def)
          }
        }
      }
    } else if (n.typeCd === 'MENU_ITEM') {
      const def = getMiMenuItemDef(n.screenElementCd)
      if (def?.path) {
        pushItem(n.screenElementCd, def)
      }
    }
  }

  return rows
}

export interface BuildMiGnbFromCompanyMenusOptions {
  /** 회사 상세 `defaultLandingCd` — 해당 TOP의 탭 기본 경로에 사용 */
  defaultLandingCd?: string
}

/**
 * 회사 상세 API `menus` 배열 순서를 유지해 GNB용 트리를 만든다.
 */
export const buildMiGnbFromCompanyMenus = (menus: IMenuNode[] | undefined, options?: BuildMiGnbFromCompanyMenusOptions): MiGnbTopMenu[] => {
  if (!menus?.length) return []

  const defaultLandingCd = options?.defaultLandingCd
  const tops = menus.filter((m) => m.typeCd === 'MENU_TOP')
  const result: MiGnbTopMenu[] = []

  tops.forEach((top, index) => {
    const topLabel = getMiMenuTopLabel(top.screenElementCd)
    if (!topLabel) {
      return
    }

    const landingInTop = defaultLandingCd && isScreenElementInCompanyMenus([top], defaultLandingCd) ? defaultLandingCd : undefined
    const landingRel = landingInTop ? getMiMenuItemDef(landingInTop)?.path : undefined
    const landingPath = landingRel ? toMiLocationPath(landingRel) : undefined

    const defaultPath = landingPath ?? firstLeafPath(top.children) ?? getDirectNavigablePath(top)
    if (!defaultPath) {
      return
    }

    const rows = buildSubmenuRows(top.children)
    result.push({
      key: `${top.screenElementCd}-${index}`,
      screenElementCd: top.screenElementCd,
      topLabel,
      defaultPath,
      rows,
    })
  })

  return result
}

/** 스크롤 복원용: `/mi/{segment}` 첫 세그먼트 목록 */
export const collectMiScrollSegmentsFromMenus = (menus: IMenuNode[] | undefined): string[] => {
  const segments = new Set<string>()
  const visit = (nodes: IMenuNode[] | undefined) => {
    if (!nodes) return
    for (const n of nodes) {
      const path = getDirectNavigablePath(n)
      if (path) {
        const seg = path
          .replace(/^\/mi\/?/, '')
          .replace(/^\/+/, '')
          .split('/')[0]
        if (seg) segments.add(seg)
      }
      visit(n.children ?? [])
    }
  }
  visit(menus)
  return [...segments]
}

/** `menus`에서 레지스트리에 등록된 첫 MENU_ITEM의 `/mi/...` 경로 (GNB와 동일한 순서: MENU_TOP 순) */
export const getFirstNavigableMiLocationFromMenus = (menus: IMenuNode[] | undefined): string | undefined => {
  if (!menus?.length) return undefined
  const tops = menus.filter((m) => m.typeCd === 'MENU_TOP')
  for (const top of tops) {
    const p = firstLeafPath([top])
    if (p) return p
  }
  return firstLeafPath(menus)
}
