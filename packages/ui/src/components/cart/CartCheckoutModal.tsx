import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { Logo } from '../../modal/Modal'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence } from 'framer-motion'
import { AnimatedOverlay, StyledAnimatedContent } from '../../primitives/Dialog'
import { Anchor, Button, Flex, Text, Box, Loader } from '../../primitives'
import { styled } from '@stitches/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faClose,
  faCube,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'
import { ProviderOptionsContext } from '../../ReservoirKitProvider'
import { TokenCheckout } from '../../modal/TokenCheckout'
import { Cart, CheckoutStatus } from '../../context/CartProvider'
import { useCoinConversion } from '../../hooks'
import SigninStep from '../../modal/SigninStep'
import { ApprovalCollapsible } from '../../modal/ApprovalCollapsible'
import { Execute } from '@reservoir0x/reservoir-sdk'

const Title = styled(DialogPrimitive.Title, {
  margin: 0,
})

export type Path = NonNullable<Execute['path']>[0]

type Props = {
  items: Cart['items']
  totalPrice: number
  usdPrice: ReturnType<typeof useCoinConversion>
  currency: NonNullable<Cart['items'][0]['price']>['currency']
  cartChain: Cart['chain']
  blockExplorerBaseUrl: string
  transaction?: Cart['transaction']
  open?: boolean
  setCartPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function CartCheckoutModal({
  items,
  totalPrice,
  usdPrice,
  currency,
  cartChain,
  blockExplorerBaseUrl,
  transaction,
  open,
  setCartPopoverOpen,
}: Props): ReactElement {
  const [dialogOpen, setDialogOpen] = useState(false)
  const providerOptionsContext = useContext(ProviderOptionsContext)

  const images = items.slice(0, 2).map((item) => {
    const { token, collection } = item
    const contract = collection.id.split(':')[0]

    return `${cartChain?.baseApiUrl}/redirect/tokens/${contract}:${token.id}/image/v1`
  })

  const pathMap = transaction?.path
    ? (transaction.path as Path[]).reduce(
        (paths: Record<string, Path>, path: Path) => {
          if (path.orderId) {
            paths[path.orderId] = path
          }

          return paths
        },
        {} as Record<string, Path>
      )
    : {}

  // const images2 = transaction?.currentStep?.items?.slice(0, 2).map((item) => {
  //   const { token, collection } = item
  //   const contract = collection.id.split(':')[0]

  //   return `${cartChain?.baseApiUrl}/redirect/tokens/${contract}:${token.id}/image/v1`
  // })

  console.log(transaction)

  console.log('path map: ', pathMap)

  useEffect(() => {
    if (open !== undefined && open !== dialogOpen) {
      setDialogOpen(open)
    }
  }, [open])

  return (
    <DialogPrimitive.Root
      onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setCartPopoverOpen(false)
        }
      }}
      open={dialogOpen}
    >
      <AnimatePresence>
        {dialogOpen && (
          <DialogPrimitive.DialogPortal forceMount>
            <AnimatedOverlay style={{ zIndex: 1002 }} />
            <StyledAnimatedContent
              forceMount
              css={{
                zIndex: 1003,
              }}
            >
              <Flex
                css={{
                  p: 16,
                  backgroundColor: '$headerBackground',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopRightRadius: '$borderRadius',
                  borderTopLeftRadius: '$borderRadius',
                }}
              >
                <Title css={{ alignItems: 'center', display: 'flex' }}>
                  <Text style="h6">Complete Checkout</Text>
                </Title>
                <DialogPrimitive.Close asChild>
                  <Button
                    color="ghost"
                    size="none"
                    css={{ color: '$neutralText' }}
                  >
                    <FontAwesomeIcon icon={faClose} width={16} height={16} />
                  </Button>
                </DialogPrimitive.Close>
              </Flex>
              <Box css={{ maxHeight: '85vh', overflowY: 'auto' }}>
                {transaction?.status === CheckoutStatus.Approving && (
                  <Flex direction="column">
                    <Box
                      css={{
                        p: '$4',
                        borderBottom: '1px solid $neutralBorder',
                      }}
                    >
                      <TokenCheckout
                        itemCount={items.length}
                        images={images}
                        totalPrice={totalPrice}
                        usdPrice={usdPrice}
                        currency={currency}
                        chain={cartChain}
                      />
                    </Box>
                    <Flex
                      direction="column"
                      css={{ p: '$4', overflowY: 'auto' }}
                    >
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        css={{
                          color: '$neutralBorderHover',
                          flex: 1,
                          gap: '$5',
                        }}
                      >
                        {transaction?.currentStep == undefined ? (
                          <Flex css={{ py: '$5' }}>
                            <Loader />
                          </Flex>
                        ) : null}
                        {transaction?.currentStep &&
                        transaction?.currentStep?.id === 'auth' ? (
                          <SigninStep css={{ mt: 48, mb: '$4', gap: 20 }} />
                        ) : null}
                        {transaction?.currentStep &&
                        transaction?.currentStep?.id !== 'auth' ? (
                          <>
                            {transaction?.currentStep?.items &&
                            transaction.currentStep?.items.length > 1 ? (
                              <Flex
                                direction="column"
                                css={{ gap: '$4', width: '100%' }}
                              >
                                <Text style="h6" css={{ textAlign: 'center' }}>
                                  Approve Purchases
                                </Text>
                                <Text style="subtitle2" color="subtle">
                                  Due to limitations with Blur, the purchase of
                                  these items needs to be split into{' '}
                                  {transaction?.currentStep?.items.length}{' '}
                                  separate transactions.
                                </Text>
                                {transaction.currentStep?.items.map((item) => (
                                  <ApprovalCollapsible
                                    item={item}
                                    transaction={transaction}
                                    pathMap={pathMap}
                                    usdPrice={usdPrice}
                                    cartChain={cartChain}
                                    open={true}
                                  />
                                ))}
                              </Flex>
                            ) : (
                              <>
                                <Text style="h6">
                                  Confirm transaction in your wallet
                                </Text>
                                <Box css={{ color: '$neutralText' }}>
                                  <FontAwesomeIcon
                                    icon={faWallet}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      margin: '12px 0px',
                                    }}
                                  />
                                </Box>
                              </>
                            )}
                          </>
                        ) : null}
                      </Flex>
                    </Flex>
                    <Button disabled={true} css={{ m: '$4' }}>
                      <Loader />
                      Waiting for Approval...
                    </Button>
                  </Flex>
                )}
                {transaction?.status === CheckoutStatus.Finalizing && (
                  <Flex direction="column">
                    <Box
                      css={{
                        p: '$4',
                        borderBottom: '1px solid $neutralBorder',
                      }}
                    >
                      <TokenCheckout
                        itemCount={items.length}
                        images={images}
                        totalPrice={totalPrice}
                        usdPrice={usdPrice}
                        currency={currency}
                        chain={cartChain}
                      />
                    </Box>
                    <Flex direction="column" css={{ p: '$4' }}>
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        css={{
                          gap: '$4',
                        }}
                      >
                        <Text style="h6">Finalizing on blockchain</Text>
                        <Text style="subtitle2" color="subtle">
                          You can close this modal while it is finalizing on the
                          blockchain; you will be notified once the validation
                          process is complete.
                        </Text>

                        <FontAwesomeIcon icon={faCube} width="24" />
                      </Flex>
                    </Flex>
                    <Button disabled={true} css={{ m: '$4' }}>
                      <Loader />
                      Waiting to be Validated...
                    </Button>
                  </Flex>
                )}

                {transaction?.status === CheckoutStatus.Complete && (
                  <Flex direction="column">
                    <Box
                      css={{
                        color: '$successAccent',
                        mb: 24,
                      }}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} fontSize={32} />
                    </Box>
                    <Text>Congrats! Items purchased successfully.</Text>
                    <Flex direction="column" css={{ gap: '$2' }}>
                      {transaction.currentStep?.items?.map((item) => {
                        console.log('complete item: ', item)
                        // @ts-ignore
                        const itemCount = item.orderIds.length || 1
                        const itemSubject = itemCount > 1 ? 'items' : 'item'

                        return (
                          <Anchor
                            href={`${blockExplorerBaseUrl}/tx/${item?.txHash}`}
                            color="primary"
                            weight="medium"
                            target="_blank"
                            css={{ fontSize: 12 }}
                          >
                            View transaction for {itemCount} {itemSubject} on
                            Etherscan
                          </Anchor>
                        )
                      })}
                    </Flex>
                    <Button
                      css={{ m: '$4' }}
                      onClick={() => setDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </Flex>
                )}
              </Box>

              {!providerOptionsContext.disablePoweredByReservoir && (
                <Flex
                  css={{
                    mx: 'auto',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '$footerBackground',
                    py: 10.5,
                    visibility: '$poweredByReservoirVisibility',
                    borderBottomRightRadius: '$borderRadius',
                    borderBottomLeftRadius: '$borderRadius',
                  }}
                >
                  <Anchor href="https://reservoir.tools/" target="_blank">
                    <Text
                      style="body2"
                      css={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Powered by <Logo />
                    </Text>
                  </Anchor>
                </Flex>
              )}
            </StyledAnimatedContent>
          </DialogPrimitive.DialogPortal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
