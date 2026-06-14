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

export const wagmiConfig = getDefaultConfig({
  appName: 'ShadowX',
  projectId: WALLETCONNECT_PROJECT_ID,
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
