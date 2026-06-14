import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { BSC_CHAIN_ID } from '../config/constants'

export function useForceBsc() {
  const { isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    if (isConnected && chainId !== BSC_CHAIN_ID) {
      switchChain({ chainId: BSC_CHAIN_ID })
    }
  }, [isConnected, chainId, switchChain])
}
