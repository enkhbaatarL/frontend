import { SvgIconTypeMap } from '@mui/material'
import { OverridableComponent } from '@mui/material/OverridableComponent'
import { ComponentProps, JSX } from 'react'
import { RouteObject } from 'react-router-dom'

export type Nullable<T> = T | null

export interface ICommonOptions {
  label: string
  value: string
}

export interface ICustomRouteObject extends Omit<RouteObject, 'children'> {
  icon?: (props: ComponentProps<OverridableComponent<SvgIconTypeMap>>) => JSX.Element
  label?: string
  children?: ICustomRouteObject[]
  hidden?: boolean
  hasBack?: boolean
  parentPath?: string
}

export interface IFilterItem {
  key: string
  value: string
}

export type MiPagesType = 'main' | 'dashboard' | 'insights' | 'market-data' | 'signal-map' | 'custom' | 'news' | 'letter'
