import { keyframes } from '@emotion/react'

import type { SxProps, Theme } from '@mui/material'

export const OVERVIEW_ACCORDION_COLLAPSE_DURATION_MS = 800
export const OVERVIEW_ACCORDION_COLLAPSE_EXIT_DURATION_MS = 300
export const OVERVIEW_ACCORDION_COLLAPSE_FADE_ENTER_MS = 300
export const OVERVIEW_ACCORDION_COLLAPSE_FADE_EXIT_MS = 360
export const overviewAccordionCollapsedHeightEase = 'cubic-bezier(0.4, 0, 0.2, 1)'
export const overviewAccordionCollapseExitEase = 'cubic-bezier(0.4, 0, 0.2, 1)'
export const overviewAccordionSoftEase = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
export const overviewAccordionSurfaceEase = 'ease-in-out'
export const OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS = 200
export const OVERVIEW_ACCORDION_SUMMARY_DIVIDER_FADE_MS = 480
export const OVERVIEW_ACCORDION_CARD_SHELL_DURATION_MS = OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS
export const OVERVIEW_ACCORDION_FRAME_BORDER_DEEPEN_MS = 700
export const OVERVIEW_ACCORDION_FRAME_BORDER_FADE_MS = 160
export const OVERVIEW_ACCORDION_EXPANDED_ROW_GAP_Y_PX = 8
export const OVERVIEW_ACCORDION_EXPAND_DETAIL_DELAY_MS = 0
export const OVERVIEW_ACCORDION_DETAIL_ROW_HEIGHT_PX = 56
export const OVERVIEW_ACCORDION_DETAIL_BODY_REVEAL_MS = 180

export const overviewAccordionDetailSurfaceRevealKeyframes = keyframes({
  '0%': {
    opacity: 0.01,
    transform: 'translateY(-3px)',
  },
  '46%': {
    opacity: 0.72,
    transform: 'translateY(-1px)',
  },
  '100%': {
    opacity: 1,
    transform: 'translateY(0)',
  },
})

export const OVERVIEW_ACCORDION_ROW_HOVER_BORDER_RADIUS = '10px'

export const accordionFrameSurfaceSx =
  ({ expanded, animating }: { expanded: boolean; animating: boolean }): SxProps<Theme> =>
    (theme) => {
      const activeBorderColor = theme.palette.contentBorder?.Active ?? theme.palette.gray[40]

      return {
        p: expanded ? '8px' : 0,
        mt: expanded ? `${OVERVIEW_ACCORDION_EXPANDED_ROW_GAP_Y_PX}px` : 0,
        mb: expanded ? `${OVERVIEW_ACCORDION_EXPANDED_ROW_GAP_Y_PX}px` : 0,
        borderRadius: expanded ? '10px' : 0,
        bgcolor: expanded ? 'contentBG.PrimaryFade' : 'transparent',
        boxShadow: expanded ? `inset 0 0 0 1px ${activeBorderColor}` : 'inset 0 0 0 1px rgba(0, 0, 0, 0)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: [
          `padding ${OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS}ms ${overviewAccordionSoftEase}`,
          `margin-top ${OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS}ms ${overviewAccordionSoftEase}`,
          `margin-bottom ${OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS}ms ${overviewAccordionSoftEase}`,
          `border-radius ${OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS}ms ${overviewAccordionSoftEase}`,
          `background-color ${OVERVIEW_ACCORDION_CARD_SHELL_DURATION_MS}ms ${overviewAccordionSurfaceEase}`,
          `box-shadow ${expanded ? OVERVIEW_ACCORDION_FRAME_BORDER_DEEPEN_MS : OVERVIEW_ACCORDION_FRAME_BORDER_FADE_MS}ms ${
            expanded ? overviewAccordionSoftEase : overviewAccordionCollapsedHeightEase
          }`,
        ].join(', '),
        willChange: animating ? 'padding, margin-top, margin-bottom, border-radius, background-color, box-shadow' : 'auto',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          willChange: 'auto',
        },
      }
    }

export const accordionSummarySurfaceSx =
  ({
    expanded,
    hovered = false,
    beforeHovered = false,
    beforeExpanded = false,
  }: {
    expanded: boolean
    hovered?: boolean
    beforeHovered?: boolean
    beforeExpanded?: boolean
  }): SxProps<Theme> =>
    (theme) => ({
      borderBottom:
      expanded || hovered || beforeHovered || beforeExpanded
        ? '1px solid rgba(0, 0, 0, 0)'
        : `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}`,
      borderRadius: hovered ? OVERVIEW_ACCORDION_ROW_HOVER_BORDER_RADIUS : 0,
      bgcolor: 'transparent',
      position: 'relative',
      zIndex: expanded ? 2 : hovered ? 1 : 0,
      transition: [
        `background-color ${OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS}ms ${overviewAccordionSurfaceEase}`,
        `border-color ${OVERVIEW_ACCORDION_SUMMARY_DIVIDER_FADE_MS}ms ${overviewAccordionSoftEase}`,
        `border-radius ${OVERVIEW_ACCORDION_CARD_SHELL_MORPH_MS}ms ${overviewAccordionSurfaceEase}`,
      ].join(', '),
      '&:hover': expanded
        ? undefined
        : {
          backgroundColor: theme.palette.gray[10],
          borderRadius: OVERVIEW_ACCORDION_ROW_HOVER_BORDER_RADIUS,
        },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    })
