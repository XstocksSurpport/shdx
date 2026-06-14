import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { BSC_CHAIN_ID } from '../config/constants'

export function useForceBsc() {
  const { isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  useEffect(() => {
    if (isConnected && chainId !== BSC_CHAIN_ID) {
      switchChainAsync({ chainId: BSC_CHAIN_ID }).catch(() => {})
    }
  }, [isConnected, chainId, switchChainAsync])
}
