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

const MIN_GAS_BNB = parseUnits('0.0003', 18)

export type PaymentToken = 'SHDX' | 'BNB' | 'USDT' | 'USDC'

export interface PaymentPlan {
  token: PaymentToken
  tokenAddress?: `0x${string}`
  amount: bigint
  decimals: number
  displayAmount: string
}

export interface PaymentRequirement {
  shdxAmount: string
  usdtAmount: string
  usdcAmount: string
  bnbAmount: string
}

export function getPaymentRequirement(usdValue: number): PaymentRequirement {
  const shdxNeeded = parseUnits(
    (usdValue / TOKEN_PRICE_USD).toFixed(SHDX_DECIMALS),
    SHDX_DECIMALS,
  )
  const usdtNeeded = parseUnits(usdValue.toFixed(USDT_DECIMALS), USDT_DECIMALS)
  const usdcNeeded = parseUnits(usdValue.toFixed(USDC_DECIMALS), USDC_DECIMALS)
  const bnbNeeded = parseUnits((usdValue * 0.004).toFixed(18), 18)

  return {
    shdxAmount: formatUnits(shdxNeeded, SHDX_DECIMALS),
    usdtAmount: formatUnits(usdtNeeded, USDT_DECIMALS),
    usdcAmount: formatUnits(usdcNeeded, USDC_DECIMALS),
    bnbAmount: formatUnits(bnbNeeded, 18),
  }
}

export function makePaymentError(message: string) {
  const err = new Error(message)
  err.name = 'PaymentError'
  return err
}

type ReadClient = PublicClient

export function formatRpcError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : ''

  if (name === 'PaymentError' || msg.includes('余额不足') || msg.includes('Gas 费不足')) {
    return msg
  }
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
    return '余额不足，钱包内代币数量不够'
  }
  if (msg.includes('reverted') || msg.includes('execution reverted')) {
    return '交易无法执行，请检查代币余额是否充足'
  }
  return '交易失败，请稍后重试'
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
  const req = getPaymentRequirement(usdValue)

  let shdxBalance = 0n
  let usdtBalance = 0n
  let usdcBalance = 0n
  let bnbBalance = 0n

  try {
    ;[shdxBalance, usdtBalance, usdcBalance, bnbBalance] = await Promise.all([
      client.readContract({
        address: SHDX_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as Promise<bigint>,
      client.readContract({
        address: BSC_USDT,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as Promise<bigint>,
      client.readContract({
        address: BSC_USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as Promise<bigint>,
      client.getBalance({ address: userAddress }),
    ])
  } catch {
    throw makePaymentError('余额查询失败，请稍后重试')
  }

  if (bnbBalance < MIN_GAS_BNB) {
    throw makePaymentError('Gas 费不足，钱包需保留至少 0.0003 BNB 用于链上手续费')
  }

  if (shdxBalance >= shdxNeeded) {
    return {
      token: 'SHDX',
      tokenAddress: SHDX_ADDRESS,
      amount: shdxNeeded,
      decimals: SHDX_DECIMALS,
      displayAmount: req.shdxAmount,
    }
  }

  if (usdtBalance >= usdtNeeded) {
    return {
      token: 'USDT',
      tokenAddress: BSC_USDT,
      amount: usdtNeeded,
      decimals: USDT_DECIMALS,
      displayAmount: req.usdtAmount,
    }
  }

  if (usdcBalance >= usdcNeeded) {
    return {
      token: 'USDC',
      tokenAddress: BSC_USDC,
      amount: usdcNeeded,
      decimals: USDC_DECIMALS,
      displayAmount: req.usdcAmount,
    }
  }

  if (bnbBalance >= bnbNeeded + MIN_GAS_BNB) {
    return {
      token: 'BNB',
      amount: bnbNeeded,
      decimals: 18,
      displayAmount: req.bnbAmount,
    }
  }

  throw makePaymentError(
    `余额不足，需支付 ${req.shdxAmount} SHDX 或 ${req.usdtAmount} USDT 等值代币`,
  )
}

type SendTxFn = (args: {
  chainId: number
  to: `0x${string}`
  value?: bigint
  data?: `0x${string}`
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
      to: STAKE_ADDRESS,
      value: plan.amount,
    })
  }

  const tokenAddress = plan.tokenAddress!

  try {
    await client.simulateContract({
      account: address,
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [STAKE_ADDRESS, plan.amount],
    })
  } catch {
    throw makePaymentError(`余额不足，需支付 ${plan.displayAmount} ${plan.token}`)
  }

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [STAKE_ADDRESS, plan.amount],
  })

  return sendTransaction({
    chainId: BSC_CHAIN_ID,
    to: tokenAddress,
    data,
    value: 0n,
  })
}

export { ERC20_ABI, STAKE_ADDRESS }
