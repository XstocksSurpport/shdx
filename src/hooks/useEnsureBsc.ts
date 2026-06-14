import { useAccount, useSwitchChain } from 'wagmi'
import { BSC_CHAIN_ID } from '../config/constants'
import { PaymentError } from '../utils/payment'

export function useEnsureBsc() {
  const { chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const ensureBsc = async () => {
    if (chainId !== BSC_CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: BSC_CHAIN_ID })
      } catch {
        throw new PaymentError('请切换至 BNB Chain 后重试')
      }
    }
  }

  return { ensureBsc, isOnBsc: chainId === BSC_CHAIN_ID }
}
