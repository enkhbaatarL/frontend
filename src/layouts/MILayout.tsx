import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import MIFooter from '@/components/mi/MIFooter.tsx'
import MIHeaderMainLayout from '@/components/mi/MIHeaderMainLayout.tsx'
import MIProvider from '@/providers/MIProvider.tsx'

const MILayout = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const portalOpen = document.querySelector('[role="menu"], [role="listbox"]')

      document.body.classList.toggle('mui-list-open', !!portalOpen)
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return (
    <MIProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className={`main-header ${isScrolled ? 'fixed-header' : ''}`}>
          <MIHeaderMainLayout />
        </div>
        <Box
          sx={{
            paddingTop: '106px',
            flex: 1,
            '@media(max-width: 600px)': {
              paddingTop: '90px',
            },
          }}
        >
          <Outlet />
        </Box>

        <MIFooter />
      </div>
    </MIProvider>
  )
}

export default MILayout
