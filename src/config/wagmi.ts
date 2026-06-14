import { getDefaultConfig } from '@rainbow-me/rainbowkit'
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
  ssr: false,
})
