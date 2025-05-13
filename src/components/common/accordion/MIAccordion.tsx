import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Tooltip, Typography } from '@mui/material'
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion'
import MuiAccordionDetails from '@mui/material/AccordionDetails'
import MuiAccordionSummary, { accordionSummaryClasses, AccordionSummaryProps } from '@mui/material/AccordionSummary'
import { styled } from '@mui/material/styles'
import { ComponentProps, ReactNode, SyntheticEvent, useState } from 'react'

import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'

interface AccordionItem {
  key: string
  title: string
  content: ReactNode
  isRequired?: boolean
  tooltip?: string
}

interface CustomAccordionProps {
  isBorder?: boolean
  items: AccordionItem[]
  defaultExpandedKeys?: string[]
  visibleKeys?: string[]
}

const Accordion = styled((props: AccordionProps & { isBorder?: boolean }) => {
  const { isBorder, ...rest } = props

  return <MuiAccordion disableGutters elevation={0} square {...rest} />
})(({ isBorder }) => ({
  padding: isBorder ? '12px' : '10px 0',
  borderBottom: isBorder ? '1px solid #DEE2E6' : 'none',
  borderRadius: 0,
  '&:last-child': { paddingBottom: isBorder ? 12 : 0 },
  '&:first-of-type': { paddingTop: isBorder ? 12 : 0 },
  '&::before': { display: 'none' },
  '&.Mui-expanded': {
    backgroundColor: isBorder ? '#F8F9FA' : 'transparent',
  },
}))

const AccordionSummary = styled((props: AccordionSummaryProps & { isBorder?: boolean }) => {
  const { isBorder, ...rest } = props

  return <MuiAccordionSummary expandIcon={<ChevronRightIcon className="accordion-icon" fontSize="small" />} {...rest} />
})(({ isBorder, theme }) => ({
  [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
    backgroundColor: isBorder ? 'transparent' : '#fff',
    borderRadius: '6px',
    border: isBorder ? 'none' : '1px solid',
    borderColor: '#DEE2E6',
    width: isBorder ? 32 : 28,
    height: isBorder ? 32 : 28,
    boxSizing: 'border-box',
    color: '#868E96',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: isBorder ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: 'transform 0.3s',
  },
  backgroundColor: 'rgba(0, 0, 0, .0)',
  flexDirection: isBorder ? 'row' : 'row-reverse',
  padding: 0,
  minHeight: 'unset',
  '& .MuiTypography-root': {
    fontWeight: '700 !important',
  },
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
    transform: 'rotate(0deg)',
    backgroundColor: isBorder ? 'transparent' : 'rgba(46, 63, 94, 0.10)',
    borderColor: 'transparent',
  },
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded} .accordion-icon`]: {
    color: isBorder ? '#343A40' : '#868E96',
    transform: isBorder ? 'rotate(-90deg)' : 'rotate(90deg)',
  },
  [`& .${accordionSummaryClasses.content}`]: {
    marginLeft: isBorder ? 0 : theme.spacing(2),
    marginTop: 0,
    marginBottom: 0,
  },

  ...theme.applyStyles?.('dark', {
    backgroundColor: 'rgba(255, 255, 255, .05)',
  }),
}))

const AccordionDetails = styled((props: ComponentProps<typeof MuiAccordionDetails> & { isBorder?: boolean }) => {
  const { isBorder, ...rest } = props

  return <MuiAccordionDetails {...rest} />
})(({ isBorder }) => ({
  padding: 0,
  paddingLeft: isBorder ? 0 : 36,
  paddingBottom: isBorder ? 6 : 0,
  marginLeft: 0,
  position: 'relative',
  marginTop: isBorder ? 0 : 8,
  '&::before': {
    content: '""',
    width: 4,
    display: isBorder ? 'none' : 'block',
    height: '100%',
    backgroundColor: '#E9ECEF',
    borderRadius: 20,
    position: 'absolute',
    left: '12px',
    top: 0,
  },
}))

export default function MIAccordion({ isBorder, items, defaultExpandedKeys, visibleKeys }: Readonly<CustomAccordionProps>) {
  const [expandedPanels, setExpandedPanels] = useState<string[]>(defaultExpandedKeys || [])
  const handleChange = (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanels((prev) => (isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)))
  }

  return (
    <div>
      {items
        .filter(({ key }) => !visibleKeys || visibleKeys.includes(key))
        .map(({ key, title, content, isRequired, tooltip }) => (
          <Accordion key={key} isBorder={isBorder} expanded={expandedPanels.includes(key)} onChange={handleChange(key)}>
            <AccordionSummary isBorder={isBorder} aria-controls={`${key}-content`} id={`${key}-header`}>
              <Typography variant={isBorder ? 'tableBody1' : 'sectionTitle'} color="gray.90" component="span">
                {title}
                {isRequired && (
                  <Typography marginLeft="4px" sx={{ verticalAlign: 4, fontSize: 12, fontWeight: 900 }} component="span" color="error">
                    *
                  </Typography>
                )}
                {tooltip && (
                  <Tooltip title={tooltip}>
                    <InfoOutlineIcon style={{ verticalAlign: 'middle', marginLeft: '4px' }} width={12} height={12} color="#868E96" />
                  </Tooltip>
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails isBorder={isBorder}>
              {typeof content === 'string' ? (
                <Typography variant="tableBody2" color="gray.90" component="div">
                  {content}
                </Typography>
              ) : (
                content
              )}
            </AccordionDetails>
          </Accordion>
        ))}
    </div>
  )
}
