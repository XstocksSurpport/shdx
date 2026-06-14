import { parseUnits, formatUnits, encodeFunctionData } from 'viem'
import type { PublicClient, Hash } from 'viem'
import {
  SHDX_ADDRESS,
  STAKE_ADDRESS,
  BSC_USDT,
  BSC_USDC,
  TOKEN_PRICE_USD,
  SHDX_DECIMALS,
  USDT_DECIMALS,
  USDC_DECIMALS,
  BSC_CHAIN_ID,
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

export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentError'
  }
}

type ReadClient = PublicClient

export function formatRpcError(err: unknown): string {
  if (err instanceof PaymentError) return err.message

  const msg = err instanceof Error ? err.message : String(err)

  if (msg.includes('User rejected') || msg.includes('user rejected')) {
    return ''
  }
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    return '网络繁忙，请稍后重试'
  }
  if (
    msg.includes('insufficient funds') ||
    msg.includes('exceeds balance') ||
    msg.includes('transfer amount exceeds balance')
  ) {
    return '余额不足，请确认钱包内有足够代币'
  }
  if (msg.includes('reverted') || msg.includes('execution reverted')) {
    return '交易无法执行，请检查余额或稍后重试'
  }
  return '交易失败，请确认已切换至 BNB Chain 后重试'
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
  const bnbNeeded = parseUnits((usdValue * 0.004).toFixed(18), 18)

  const [shdxResult, usdtResult, usdcResult, bnbBalance] = await Promise.all([
    client.readContract({
      address: SHDX_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }),
    client.readContract({
      address: BSC_USDT,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }),
    client.readContract({
      address: BSC_USDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }),
    client.getBalance({ address: userAddress }),
  ])

  const shdxBalance = shdxResult as bigint
  const usdtBalance = usdtResult as bigint
  const usdcBalance = usdcResult as bigint

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

  if (bnbBalance >= bnbNeeded) {
    return {
      token: 'BNB',
      amount: bnbNeeded,
      decimals: 18,
      displayAmount: formatUnits(bnbNeeded, 18),
    }
  }

  throw new PaymentError(
    `余额不足，需支付约 ${formatUnits(shdxNeeded, SHDX_DECIMALS)} SHDX 或 ${usdValue} USDT 等值代币`,
  )
}

type SendTxFn = (args: {
  chainId: number
  to: `0x${string}`
  value?: bigint
  data?: `0x${string}`
  account: `0x${string}`
}) => Promise<Hash>

export async function executePayment(
  client: ReadClient,
  address: `0x${string}`,
  plan: PaymentPlan,
  sendTransaction: SendTxFn,
): Promise<Hash> {
  if (plan.token === 'BNB') {
    return sendTransaction({
      chainId: BSC_CHAIN_ID,
      account: address,
      to: STAKE_ADDRESS,
      value: plan.amount,
    })
  }

  const tokenAddress = plan.tokenAddress!

  await client.simulateContract({
    account: address,
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [STAKE_ADDRESS, plan.amount],
  })

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [STAKE_ADDRESS, plan.amount],
  })

  return sendTransaction({
    chainId: BSC_CHAIN_ID,
    account: address,
    to: tokenAddress,
    data,
    value: 0n,
  })
}

export { ERC20_ABI, STAKE_ADDRESS }
