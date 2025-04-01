import { Button } from '@mui/material'
import { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Flex from '@/components/common/display/Flex'
import TestRoutes from '@/routes/TestRoues'

const TestPage = () => {
  const navigate = useNavigate()

  return (
    <Flex direction="column" gap={20} className="full-height p-10">
      {TestRoutes.children
        ?.filter((child) => {
          const element = child.element as JSX.Element
          return !child.index && element?.type?.name !== 'Navigate'
        })
        .map((route) => (
          <Button key={route.path} variant="contained" onClick={() => navigate(`/test/${route.path}`)}>
            {route.path}
          </Button>
        ))}
    </Flex>
  )
}

export default TestPage
