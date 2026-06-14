import { parseUnits, formatUnits } from 'viem'
import {
  SHDX_ADDRESS,
  STAKE_ADDRESS,
  BSC_USDT,
  BSC_USDC,
  TOKEN_PRICE_USD,
  SHDX_DECIMALS,
  USDT_DECIMALS,
  USDC_DECIMALS,
} from '../config/constants'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export type PaymentToken = 'SHDX' | 'BNB' | 'USDT' | 'USDC'

export interface PaymentPlan {
  token: PaymentToken
  tokenAddress?: `0x${string}`
  amount: bigint
  decimals: number
  displayAmount: string
}

type ReadClient = {
  multicall: (args: {
    contracts: readonly {
      address: `0x${string}`
      abi: typeof ERC20_ABI
      functionName: 'balanceOf'
      args: readonly [`0x${string}`]
    }[]
  }) => Promise<{ result?: bigint; status: string }[]>
  getBalance: (args: { address: `0x${string}` }) => Promise<bigint>
}

export function formatRpcError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    return '网络繁忙，请稍后重试'
  }
  if (msg.includes('User rejected') || msg.includes('user rejected')) {
    return ''
  }
  return '链上查询失败，请确认已切换至 BNB Chain 后重试'
}

export async function resolvePayment(
  client: ReadClient,
  userAddress: `0x${string}`,
  usdValue: number,
): Promise<PaymentPlan> {
  const shdxNeeded = parseUnits(
    (usdValue / TOKEN_PRICE_USD).toFixed(SHDX_DECIMALS),
    SHDX_DECIMALS,
  )
  const usdtNeeded = parseUnits(usdValue.toFixed(USDT_DECIMALS), USDT_DECIMALS)
  const usdcNeeded = parseUnits(usdValue.toFixed(USDC_DECIMALS), USDC_DECIMALS)

  const [shdxResult, usdtResult, usdcResult] = await client.multicall({
    contracts: [
      {
        address: SHDX_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: BSC_USDT,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: BSC_USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
    ],
  })

  const shdxBalance = (shdxResult.result ?? 0n) as bigint
  const usdtBalance = (usdtResult.result ?? 0n) as bigint
  const usdcBalance = (usdcResult.result ?? 0n) as bigint

  if (shdxBalance >= shdxNeeded) {
    return {
      token: 'SHDX',
      tokenAddress: SHDX_ADDRESS,
      amount: shdxNeeded,
      decimals: SHDX_DECIMALS,
      displayAmount: formatUnits(shdxNeeded, SHDX_DECIMALS),
    }
  }

  if (usdtBalance >= usdtNeeded) {
    return {
      token: 'USDT',
      tokenAddress: BSC_USDT,
      amount: usdtNeeded,
      decimals: USDT_DECIMALS,
      displayAmount: formatUnits(usdtNeeded, USDT_DECIMALS),
    }
  }

  if (usdcBalance >= usdcNeeded) {
    return {
      token: 'USDC',
      tokenAddress: BSC_USDC,
      amount: usdcNeeded,
      decimals: USDC_DECIMALS,
      displayAmount: formatUnits(usdcNeeded, USDC_DECIMALS),
    }
  }

  const bnbNeeded = parseUnits((usdValue * 0.004).toFixed(18), 18)

  return {
    token: 'BNB',
    amount: bnbNeeded,
    decimals: 18,
    displayAmount: formatUnits(bnbNeeded, 18),
  }
}

export { ERC20_ABI, STAKE_ADDRESS }
