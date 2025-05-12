import { Box, Grid2 as Grid, Typography } from '@mui/material'

const DescriptionComponent = () => (
  <Box>
    <Typography mb={9.5} component="div" lineHeight={1.6} color="gray.90" variant="body1M16">
      Our base-case Energy Transition Outlook expects Indian energy demand to grow by around a third over the coming decade. But India has
      an opportunity to shatter that outlook and mirror the pace of China’s 2001-11 economic growth over the next 10 years.
    </Typography>
    <Grid container direction="column" gap={2}>
      <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16">
        Our base-case Energy Transition Outlook expects Indian energy demand to grow by around a third over the coming decade. But India has
        an opportunity to shatter that outlook and mirror the pace of China’s 2001-11 economic growth over the next 10 years.
      </Typography>
      <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16">
        In our high-growth scenario, India’s economy almost triples in size from US$3.2 trillion in 2023 to just under US$9 trillion in
        2033, with gross domestic product (GDP) almost 50% higher than our base case by this time.
      </Typography>
      <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16">
        When rampant Chinese economic growth sent energy demand and prices soaring through the 2000s, companies around the world cashed in.
        Would an Indian boom have a similar effect? <br />
        This month’s Horizons sets out how higher Indian economic growth could impact global energy markets. It includes our integrated view
        of:
      </Typography>
      <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16">
        The case for higher economic growth <br />
        Why India won’t be a (hydro)carbon copy of China <br />
        Tackling India’s rising carbon emissions <br />
        Global impacts – and the winners and losers of India’s high-growth scenario.
      </Typography>
      <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16">
        The full report is available in the upper right panel.
      </Typography>
    </Grid>
  </Box>
)

export default DescriptionComponent
