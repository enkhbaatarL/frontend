import { Box } from '@mui/material'

import { MIBaseSkeleton, SkeletonWrapper } from './MIBaseSkeleton.tsx'

interface ListSkeletonProps {
  itemCount?: number
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

interface FormSkeletonProps {
  fieldCount?: number
}

export const MIPageSkeletons = {
  // MI Dashboard 패턴
  Dashboard: () => (
    <SkeletonWrapper.Container>
      {/* 페이지 헤더 */}
      <SkeletonWrapper.Column gap={1} sx={{ mb: 4 }}>
        <MIBaseSkeleton.Title width={250} />
        <MIBaseSkeleton.TextLine width={400} height={14} />
      </SkeletonWrapper.Column>

      {/* 통계 카드들 (4개) */}
      <SkeletonWrapper.Grid columns={4} gap={3} sx={{ mb: 4 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <MIBaseSkeleton.Card key={i} height={120} />
        ))}
      </SkeletonWrapper.Grid>

      {/* 메인 차트와 사이드 위젯 */}
      <SkeletonWrapper.Row gap={3} sx={{ alignItems: 'flex-start' }}>
        <Box flex={2}>
          <MIBaseSkeleton.Card height={400} />
        </Box>
        <Box flex={1}>
          <SkeletonWrapper.Column gap={2}>
            <MIBaseSkeleton.Card height={190} />
            <MIBaseSkeleton.Card height={190} />
          </SkeletonWrapper.Column>
        </Box>
      </SkeletonWrapper.Row>
    </SkeletonWrapper.Container>
  ),

  // Market Data 패턴
  MarketData: () => (
    <Box>
      <MIBaseSkeleton.BaseElement width={'100%'} height={'216px'} />
      <Box
        minWidth={'1380px'}
        width={'1380px'}
        margin={'auto'}
        display={'flex'}
        flexDirection={'column'}
        gap={'38px'}
        paddingTop={'50px'}
        paddingBottom={'24px'}
      >
        <MIBaseSkeleton.BaseElement width={'294px'} height={'50px'} />
        <Box width={'1380px'} height={'916px'} gap={'20px'} paddingBottom={'17px'}>
          <SkeletonWrapper.Row gap={'20px'} sx={{ paddingBottom: '20px' }}>
            <MIBaseSkeleton.Card width={'680px'} height={'446px'} />
            <MIBaseSkeleton.Card width={'680px'} height={'446px'} />
          </SkeletonWrapper.Row>
          <SkeletonWrapper.Row gap={'20px'} sx={{ paddingBottom: '20px' }}>
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
          </SkeletonWrapper.Row>
          <SkeletonWrapper.Row gap={'20px'}>
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
            <MIBaseSkeleton.Card width={'330px'} height={'215px'} />
          </SkeletonWrapper.Row>
        </Box>
        <MIBaseSkeleton.BaseElement width={'294px'} height={'50px'} />
        <MIBaseSkeleton.BaseElement width={'458px'} height={'46px'} />
      </Box>
      <Box
        minWidth={'1380px'}
        width={'1380px'}
        margin={'auto'}
        display={'flex'}
        flexDirection={'column'}
        paddingTop={'30px'}
        borderTop={'1px solid #DEE2E6'}
      >
        <SkeletonWrapper.Row gap={'24px'}>
          <MIBaseSkeleton.Table width={'1070px'} height={'532px'} />
          <Box border="1px solid #DEE2E6" width={'286px'} height={'532px'} borderRadius={'4px'}>
            <Box width={'238px'} height={'484px'} margin={'auto'} padding={'24px'}>
              <Box paddingBottom={'10px'}>
                <MIBaseSkeleton.BaseElement2 width={'161px'} height={'24px'} />
              </Box>
              <Box width={'100%'} borderBottom={'1px solid #DEE2E6'} py={'15px'}>
                <MIBaseSkeleton.BaseElement2 width={'106px'} height={'22px'} />
                <MIBaseSkeleton.BaseElement2 width={'100%'} height={'22px'} sx={{ marginTop: '2px' }} />
                <MIBaseSkeleton.BaseElement2 width={'136px'} height={'10px'} sx={{ marginTop: '4px' }} />
              </Box>
              <Box width={'100%'} borderBottom={'1px solid #DEE2E6'} py={'15px'}>
                <MIBaseSkeleton.BaseElement2 width={'106px'} height={'22px'} />
                <MIBaseSkeleton.BaseElement2 width={'100%'} height={'22px'} sx={{ marginTop: '2px' }} />
                <MIBaseSkeleton.BaseElement2 width={'136px'} height={'10px'} sx={{ marginTop: '4px' }} />
              </Box>
              <Box width={'100%'} borderBottom={'1px solid #DEE2E6'} py={'15px'}>
                <MIBaseSkeleton.BaseElement2 width={'106px'} height={'22px'} />
                <MIBaseSkeleton.BaseElement2 width={'100%'} height={'22px'} sx={{ marginTop: '2px' }} />
                <MIBaseSkeleton.BaseElement2 width={'136px'} height={'10px'} sx={{ marginTop: '4px' }} />
              </Box>
              <Box width={'100%'} borderBottom={'1px solid #DEE2E6'} py={'15px'}>
                <MIBaseSkeleton.BaseElement2 width={'106px'} height={'22px'} />
                <MIBaseSkeleton.BaseElement2 width={'100%'} height={'22px'} sx={{ marginTop: '2px' }} />
                <MIBaseSkeleton.BaseElement2 width={'136px'} height={'10px'} sx={{ marginTop: '4px' }} />
              </Box>
              <Box width={'100%'} py={'15px'}>
                <MIBaseSkeleton.BaseElement2 width={'106px'} height={'22px'} />
                <MIBaseSkeleton.BaseElement2 width={'100%'} height={'22px'} sx={{ marginTop: '2px' }} />
                <MIBaseSkeleton.BaseElement2 width={'136px'} height={'10px'} sx={{ marginTop: '4px' }} />
              </Box>
            </Box>
          </Box>
        </SkeletonWrapper.Row>
      </Box>
    </Box>
  ),

  // Insights 검색/리스트 패턴
  Insights: ({ itemCount = 8 }: ListSkeletonProps) => (
    <SkeletonWrapper.Container>
      {/* 검색 영역 */}
      <SkeletonWrapper.Column gap={3} sx={{ mb: 4 }}>
        <MIBaseSkeleton.Title width={200} />
        <SkeletonWrapper.Row gap={2}>
          <MIBaseSkeleton.InputField width={400} height={46} />
          <MIBaseSkeleton.Button width={100} height={46} />
        </SkeletonWrapper.Row>

        {/* 필터 칩들 */}
        <SkeletonWrapper.Row gap={1}>
          {Array.from({ length: 5 }, (_, i) => (
            <MIBaseSkeleton.Chip key={i} width={80} />
          ))}
        </SkeletonWrapper.Row>
      </SkeletonWrapper.Column>

      {/* 검색 결과 리스트 */}
      <SkeletonWrapper.Column gap={2}>
        {Array.from({ length: itemCount }, (_, i) => (
          <Box key={i} p={3} border="1px solid #E9ECEF" borderRadius="8px">
            <SkeletonWrapper.Column gap={1}>
              <SkeletonWrapper.Row gap={1}>
                <MIBaseSkeleton.Chip width={60} height={18} />
                <MIBaseSkeleton.Chip width={80} height={18} />
              </SkeletonWrapper.Row>
              <MIBaseSkeleton.Title width="70%" height={20} />
              <MIBaseSkeleton.TextLine width="90%" height={14} />
              <MIBaseSkeleton.TextLine width="60%" height={14} />
              <SkeletonWrapper.Row gap={1} sx={{ mt: 1 }}>
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={80} height={12} />
              </SkeletonWrapper.Row>
            </SkeletonWrapper.Column>
          </Box>
        ))}
      </SkeletonWrapper.Column>
    </SkeletonWrapper.Container>
  ),

  // Signal Map 패턴
  SignalMap: () => (
    <SkeletonWrapper.Container>
      {/* 컨트롤 패널 */}
      <SkeletonWrapper.Row gap={2} sx={{ mb: 3 }}>
        <MIBaseSkeleton.Button width={120} />
        <MIBaseSkeleton.Button width={100} />
        <MIBaseSkeleton.Button width={80} />
        <Box ml="auto">
          <SkeletonWrapper.Row gap={1}>
            <MIBaseSkeleton.Icon />
            <MIBaseSkeleton.Icon />
            <MIBaseSkeleton.Icon />
          </SkeletonWrapper.Row>
        </Box>
      </SkeletonWrapper.Row>

      {/* 메인 맵 영역 */}
      <MIBaseSkeleton.Card height={600} />
    </SkeletonWrapper.Container>
  ),

  // Data Detail 상세 페이지 패턴
  DataDetail: () => (
    <SkeletonWrapper.Container>
      {/* 브레드크럼과 제목 */}
      <SkeletonWrapper.Column gap={2} sx={{ mb: 4 }}>
        <SkeletonWrapper.Row gap={1}>
          <MIBaseSkeleton.TextLine width={80} height={12} />
          <MIBaseSkeleton.TextLine width={20} height={12} />
          <MIBaseSkeleton.TextLine width={120} height={12} />
        </SkeletonWrapper.Row>
        <MIBaseSkeleton.Title width={300} height={28} />
        <SkeletonWrapper.Row gap={1}>
          <MIBaseSkeleton.Chip width={80} />
          <MIBaseSkeleton.Chip width={100} />
          <MIBaseSkeleton.Chip width={60} />
        </SkeletonWrapper.Row>
      </SkeletonWrapper.Column>

      {/* 메인 컨텐츠 */}
      <SkeletonWrapper.Row gap={4} sx={{ alignItems: 'flex-start' }}>
        {/* 왼쪽 메인 영역 */}
        <Box flex={2}>
          <SkeletonWrapper.Column gap={3}>
            <MIBaseSkeleton.Card height={400} />
            <MIBaseSkeleton.Card height={300} />
          </SkeletonWrapper.Column>
        </Box>

        {/* 오른쪽 사이드바 */}
        <Box flex={1}>
          <SkeletonWrapper.Column gap={2}>
            <Box p={2} border="1px solid #E9ECEF" borderRadius="8px">
              <SkeletonWrapper.Column gap={2}>
                <MIBaseSkeleton.Subtitle width={120} />
                <MIBaseSkeleton.TextLine width="100%" height={14} />
                <MIBaseSkeleton.TextLine width="80%" height={14} />
                <MIBaseSkeleton.TextLine width="60%" height={14} />
              </SkeletonWrapper.Column>
            </Box>
            <MIBaseSkeleton.Card height={200} />
            <MIBaseSkeleton.Card height={150} />
          </SkeletonWrapper.Column>
        </Box>
      </SkeletonWrapper.Row>
    </SkeletonWrapper.Container>
  ),

  // 게시판 스켈레톤
  BoardPageSkeleton: () => (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingTop={'20px'}>
        <MIBaseSkeleton.BaseElement width={'294px'} height={'50px'} />
      </Box>

      <Box paddingTop={'20px'} paddingBottom={'20px'}>
        <MIBaseSkeleton.BaseElement width={'1380px'} height={'387px'} />
      </Box>
    </Box>
  ),

  // 게시판 상세 스켈레톤
  BoardDetailPageSkeleton: () => (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingTop={'20px'} paddingBottom={'20px'} borderBottom={'1px solid #DEE2E6'}>
        <SkeletonWrapper.Row gap={'30px'}>
          <MIBaseSkeleton.BaseElement width={'104px'} height={'20px'} />
          <MIBaseSkeleton.BaseElement width={'200px'} height={'20px'} />
        </SkeletonWrapper.Row>
      </Box>

      <Box paddingTop={'30px'} paddingBottom={'20px'}>
        <MIBaseSkeleton.BaseElement width={'1380px'} height={'387px'} />
      </Box>
      <Box gap={'16px'} paddingBottom={'30px'}>
        <MIBaseSkeleton.BaseElement width={'1380px'} height={'52px'} />
        <MIBaseSkeleton.BaseElement width={'1380px'} height={'142px'} />
      </Box>
      <Box paddingTop={'20px'} borderTop={'1px solid #DEE2E6'}>
        <MIBaseSkeleton.Button width={'104px'} height={'42px'} />
      </Box>
    </Box>
  ),

  // Help Center/FAQ 패턴
  HelpCenter: () => (
    <SkeletonWrapper.Container>
      {/* 검색 섹션 */}
      <Box textAlign="center" mb={6}>
        <MIBaseSkeleton.Title width={250} sx={{ mx: 'auto', mb: 2 }} />
        <MIBaseSkeleton.TextLine width={400} height={14} sx={{ mx: 'auto', mb: 3 }} />
        <MIBaseSkeleton.InputField width={500} height={46} sx={{ mx: 'auto' }} />
      </Box>

      {/* 카테고리 섹션 */}
      <SkeletonWrapper.Grid columns={3} gap={3} sx={{ mb: 6 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={i} p={3} border="1px solid #E9ECEF" borderRadius="8px">
            <SkeletonWrapper.Column gap={2}>
              <MIBaseSkeleton.Icon width={32} />
              <MIBaseSkeleton.Subtitle width="80%" />
              <MIBaseSkeleton.TextLine width="100%" height={12} />
              <MIBaseSkeleton.TextLine width="70%" height={12} />
            </SkeletonWrapper.Column>
          </Box>
        ))}
      </SkeletonWrapper.Grid>

      {/* FAQ 리스트 */}
      <SkeletonWrapper.Column gap={2}>
        <MIBaseSkeleton.Subtitle width={150} />
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} p={3} border="1px solid #E9ECEF" borderRadius="8px">
            <SkeletonWrapper.Row gap={2} sx={{ alignItems: 'center' }}>
              <MIBaseSkeleton.Icon width={20} />
              <MIBaseSkeleton.TextLine width="70%" height={16} />
              <Box ml="auto">
                <MIBaseSkeleton.Icon width={16} />
              </Box>
            </SkeletonWrapper.Row>
          </Box>
        ))}
      </SkeletonWrapper.Column>
    </SkeletonWrapper.Container>
  ),

  // 테이블 패턴 (관리자 페이지용)
  Table: ({ rows = 10, columns = 5 }: TableSkeletonProps) => (
    <SkeletonWrapper.Container>
      {/* 테이블 상단 액션 */}
      <SkeletonWrapper.Row gap={2} sx={{ mb: 3, justifyContent: 'space-between' }}>
        <SkeletonWrapper.Row gap={2}>
          <MIBaseSkeleton.Button width={100} />
          <MIBaseSkeleton.Button width={120} />
        </SkeletonWrapper.Row>
        <MIBaseSkeleton.Button width={80} />
      </SkeletonWrapper.Row>

      {/* 테이블 헤더 */}
      <Box border="1px solid #E9ECEF" borderRadius="8px 8px 0 0" bgcolor="gray.5" p={2}>
        <SkeletonWrapper.Row gap={2}>
          {Array.from({ length: columns }, (_, i) => (
            <MIBaseSkeleton.TextLine key={i} width={`${100 / columns}%`} height={16} />
          ))}
        </SkeletonWrapper.Row>
      </Box>

      {/* 테이블 바디 */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <Box key={rowIndex} border="1px solid #E9ECEF" borderTop="none" p={2} sx={{ '&:last-child': { borderRadius: '0 0 8px 8px' } }}>
          <SkeletonWrapper.Row gap={2}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <MIBaseSkeleton.TextLine key={colIndex} width={`${100 / columns}%`} height={14} />
            ))}
          </SkeletonWrapper.Row>
        </Box>
      ))}

      {/* 페이지네이션 */}
      <SkeletonWrapper.Row gap={1} sx={{ mt: 3, justifyContent: 'center' }}>
        {Array.from({ length: 7 }, (_, i) => (
          <MIBaseSkeleton.Button key={i} width={32} height={32} />
        ))}
      </SkeletonWrapper.Row>
    </SkeletonWrapper.Container>
  ),

  // 폼 패턴
  Form: ({ fieldCount = 6 }: FormSkeletonProps) => (
    <SkeletonWrapper.Container sx={{ maxWidth: 600 }}>
      {/* 폼 제목 */}
      <SkeletonWrapper.Column gap={1} sx={{ mb: 4 }}>
        <MIBaseSkeleton.Title width={200} />
        <MIBaseSkeleton.TextLine width={400} height={14} />
      </SkeletonWrapper.Column>

      {/* 폼 필드들 */}
      <SkeletonWrapper.Column gap={3}>
        {Array.from({ length: fieldCount }, (_, i) => (
          <SkeletonWrapper.Column key={i} gap={1}>
            <MIBaseSkeleton.TextLine width={100} height={16} />
            <MIBaseSkeleton.InputField height={34} />
          </SkeletonWrapper.Column>
        ))}

        {/* 폼 액션 버튼들 */}
        <SkeletonWrapper.Row gap={2} sx={{ mt: 4, justifyContent: 'flex-end' }}>
          <MIBaseSkeleton.Button width={80} />
          <MIBaseSkeleton.Button width={80} />
        </SkeletonWrapper.Row>
      </SkeletonWrapper.Column>
    </SkeletonWrapper.Container>
  ),
}
