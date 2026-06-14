import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { SHDX_ADDRESS, BSC_CHAIN_ID, SHDX_DECIMALS } from '../config/constants'
import { ERC20_ABI } from '../utils/payment'

export function useShdxBalance() {
  const { address, isConnected } = useAccount()

  const { data, refetch, isLoading } = useReadContract({
    address: SHDX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: BSC_CHAIN_ID,
    query: { enabled: !!address, refetchInterval: 10000 },
  })

  const balance = (data as bigint | undefined) ?? 0n
  const formatted = formatUnits(balance, SHDX_DECIMALS)

  return { balance, formatted, refetch, isLoading, isConnected }
}
