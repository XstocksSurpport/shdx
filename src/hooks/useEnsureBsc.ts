import { useAccount, useSwitchChain } from 'wagmi'
import { BSC_CHAIN_ID } from '../config/constants'

export function useEnsureBsc() {
  const { chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const ensureBsc = async () => {
    if (chainId === BSC_CHAIN_ID) return
    try {
      await switchChainAsync({ chainId: BSC_CHAIN_ID })
    } catch {
      // already on BSC but wagmi chainId not synced — proceed
    }
  }

  return { ensureBsc, isOnBsc: chainId === BSC_CHAIN_ID }
}
