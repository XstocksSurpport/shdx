import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, fallback } from 'viem'
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  mainnet,
  optimism,
  polygon,
  zkSync,
  linea,
  scroll,
} from 'wagmi/chains'
import { WALLETCONNECT_PROJECT_ID } from './constants'
import { walletGroups } from './wallets'

const bscTransport = fallback([
  http('https://bsc-dataseed.binance.org'),
  http('https://bsc-dataseed1.binance.org'),
  http('https://bsc-dataseed2.binance.org'),
  http('https://bsc-dataseed3.binance.org'),
  http('https://bsc-dataseed4.binance.org'),
  http('https://rpc.ankr.com/bsc'),
], { rank: true, retryCount: 2 })

export const wagmiConfig = getDefaultConfig({
  appName: 'ShadowX',
  appDescription: 'ShadowX SHDX Portal',
  appUrl: 'https://shdx-ashen.vercel.app',
  projectId: WALLETCONNECT_PROJECT_ID,
  wallets: walletGroups,
  walletConnectParameters: {
    metadata: {
      name: 'ShadowX',
      description: 'ShadowX SHDX Portal',
      url: 'https://shdx-ashen.vercel.app',
      icons: ['https://shdx-ashen.vercel.app/favicon.svg'],
    },
  },
  chains: [
    bsc,
    mainnet,
    polygon,
    arbitrum,
    optimism,
    avalanche,
    base,
    zkSync,
    linea,
    scroll,
  ],
  transports: {
    [bsc.id]: bscTransport,
  },
  ssr: false,
})
