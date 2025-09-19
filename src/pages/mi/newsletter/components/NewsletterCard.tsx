import { Add as AddIcon } from '@mui/icons-material'
import { Box, Typography, Card, CardMedia, Button, Tooltip } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import defaultImage from '@/assets/newsletter/default-image.png'
import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'
import { IFeaturedNewsletterItem } from '@/service/mi/newsletter'

interface Props {
  featuredNewsletterItem: IFeaturedNewsletterItem
  onSubscribe: (newsletterId: string) => void
  onClick: (newsletterId: string, issueNo: string) => void
  disabled?: boolean
  updating?: boolean
}

const TRANSITION_DELAY = 200

const NewsletterCard = ({ featuredNewsletterItem, onSubscribe, onClick, disabled, updating }: Props) => {
  const [imageLoadError, setImageLoadError] = useState(false)
  const [tooltipTitle, setTooltipTitle] = useState('')
  const [renderTooltip, setRenderTooltip] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setTooltipTitle(featuredNewsletterItem.subscribed ? 'Unsubscribe' : 'Subscribe')
      setRenderTooltip(!updating)
    }, TRANSITION_DELAY)
  }, [updating, featuredNewsletterItem.subscribed])

  const SubscribeButton = useMemo(() => {
    const renderSubscribeButtonIcon = () => {
      if (updating) {
        return (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            width={'20px'}
            height={'20px'}
            sx={{
              backgroundColor: 'linear-gradient(107deg, #C2C2C2 8.8%, #FFF 54.4%, #FFF 67.11%, #C4C4C4 100%)',
            }}
          >
            <LoadingSpinner stop={renderTooltip} speed={2} />
          </Box>
        )
      }

      if (featuredNewsletterItem.subscribed) {
        return <CheckIcon fill="content.textNormal" width={20} height={20} />
      }

      return <AddIcon sx={{ fontSize: '20px' }} />
    }

    return (
      <Button
        variant="outlined"
        size="small"
        disabled={updating}
        sx={{
          borderColor: featuredNewsletterItem.subscribed || updating ? '#DEE2E6' : '#2E3F5E',
          color: featuredNewsletterItem.subscribed ? 'content.textNormal' : '#2E3F5E',
          borderRadius: '4px',
          padding: '4px',
          minWidth: 'auto',
          width: '28px',
          height: '28px',
          '&:hover': {
            borderColor: featuredNewsletterItem.subscribed ? '#DEE2E6' : '#1e2a4a',
            backgroundColor: '#f8f9fa',
          },
          transition: `border-color ${TRANSITION_DELAY}ms ease-in-out`,
        }}
        onClick={() => {
          onSubscribe(featuredNewsletterItem.newsletterId)
        }}
      >
        {renderSubscribeButtonIcon()}
      </Button>
    )
  }, [featuredNewsletterItem.newsletterId, featuredNewsletterItem.subscribed, onSubscribe, updating, renderTooltip])

  return (
    <Card
      elevation={0}
      sx={{
        minHeight: '316px',
        height: '100%',
        border: '1px solid',
        borderColor: '#DEE2E6',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        boxSizing: 'border-box',
        gap: '12px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          cursor: 'pointer',
          gap: '12px',
        }}
        onClick={() => {
          onClick(featuredNewsletterItem.newsletterId, featuredNewsletterItem.issueNo)
        }}
      >
        <CardMedia
          component="div"
          sx={{
            height: 100,
            width: '100%',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'gray.60',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '8px',
            alignSelf: 'stretch',
            overflow: 'hidden',
          }}
        >
          {imageLoadError ? (
            <Box
              component="img"
              src={defaultImage}
              alt={featuredNewsletterItem.name}
              draggable={false}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              component="img"
              src={featuredNewsletterItem.imageBase64}
              alt={featuredNewsletterItem.name}
              draggable={false}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImageLoadError(true)}
            />
          )}
        </CardMedia>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            alignSelf: 'stretch',
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
              alignSelf: 'stretch',
            }}
          >
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: 1.4,
                color: '#868E96',
                alignSelf: 'stretch',
              }}
            >
              {featuredNewsletterItem.frequency}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: 1.4,
                color: disabled ? '#ADB5BD' : '#212529',
                alignSelf: 'stretch',
              }}
            >
              {featuredNewsletterItem.name}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: 1.4,
              color: disabled ? '#ADB5BD' : '#212529',
              alignSelf: 'stretch',
            }}
          >
            {featuredNewsletterItem.description}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: disabled ? 'flex-end' : 'space-between',
          alignItems: 'center',
          alignSelf: 'stretch',
          gap: '12px',
        }}
      >
        {disabled ? (
          <Button
            variant="outlined"
            size="small"
            disabled
            sx={{
              borderColor: '#E9ECEF',
              color: '#ADB5BD',
              backgroundColor: '#F1F3F5',
              borderRadius: '4px',
              padding: '4px 12px',
              height: '28px',
              '&.Mui-disabled': {
                borderColor: '#E9ECEF',
                color: '#ADB5BD',
                backgroundColor: '#F1F3F5',
              },
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: 1.4,
                color: '#ADB5BD',
              }}
            >
              Coming soon
            </Typography>
          </Button>
        ) : (
          <>
            {renderTooltip ? (
              <Tooltip
                title={tooltipTitle}
                placement="right"
                disableInteractive
                slotProps={{
                  popper: {
                    sx: {
                      opacity: updating ? 0 : 1,
                      transition: `opacity ${TRANSITION_DELAY}ms ease-in-out`,
                    },
                  },
                }}
              >
                {SubscribeButton}
              </Tooltip>
            ) : (
              SubscribeButton
            )}

            <Button
              variant="outlined"
              size="small"
              sx={{
                borderColor: '#DEE2E6',
                color: '#495057',
                borderRadius: '4px',
                padding: '4px 12px',
                height: '28px',
                '&:hover': {
                  borderColor: '#CED4DA',
                  backgroundColor: '#f8f9fa',
                },
              }}
              onClick={() => {
                onClick(featuredNewsletterItem.newsletterId, featuredNewsletterItem.issueNo)
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: 1.4,
                  color: '#495057',
                }}
              >
                See the latest
              </Typography>
            </Button>
          </>
        )}
      </Box>
    </Card>
  )
}

export default NewsletterCard
