import { Grid2 as Grid, Typography } from '@mui/material'
import Link from '@mui/material/Link'

import SkCi from '@/components/common/icons/SkCi'

const MiFooter = () => (
  <footer>
    <Grid
      paddingX={{ xs: 6, md: 22.5 }}
      paddingY={{ xs: 6, md: 10 }}
      gap={5}
      bgcolor="gray.5"
      wrap="wrap"
      container
      justifyContent="space-between"
    >
      <Grid container gap={5} direction="column">
        <SkCi />
        <Typography color="gray.60" component="div" variant="body2">
          COPYRIGHT©2025 ALL RIGHTS RESERVED. <br />
          SK구성원을 위한 시스템으로서 인가된 분만 사용할 수 있습니다. 불법으로 사용시에는 법적 제재를 받을 수 있습니다.
        </Typography>
      </Grid>
      <Typography color="gray.60" variant="body2">
        <Link marginRight={2.5} fontWeight={600} color="gray.60" variant="body2" underline="hover">
          이용약관
        </Link>
        |
        <Link marginLeft={2.5} fontWeight={600} color="gray.60" variant="body2" underline="hover">
          개인정보처리방침
        </Link>
      </Typography>
    </Grid>
  </footer>
)

export default MiFooter
