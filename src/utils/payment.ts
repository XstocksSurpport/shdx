import { parseUnits, formatUnits } from 'viem'
import {
  SHDX_ADDRESS,
  STAKE_ADDRESS,
  BSC_USDT,
  BSC_USDC,
  TOKEN_PRICE_USD,
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
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
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

export async function resolvePayment(
  client: {
    getBalance: (args: { address: `0x${string}` }) => Promise<bigint>
    readContract: (args: {
      address: `0x${string}`
      abi: typeof ERC20_ABI
      functionName: 'balanceOf' | 'decimals'
      args?: readonly [`0x${string}`]
    }) => Promise<bigint | number>
  },
  userAddress: `0x${string}`,
  usdValue: number,
): Promise<PaymentPlan> {
  const shdxDecimals = Number(
    await client.readContract({
      address: SHDX_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }),
  )
  const shdxNeeded = parseUnits(
    (usdValue / TOKEN_PRICE_USD).toFixed(shdxDecimals),
    shdxDecimals,
  )
  const shdxBalance = (await client.readContract({
    address: SHDX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })) as bigint

  if (shdxBalance >= shdxNeeded) {
    return {
      token: 'SHDX',
      tokenAddress: SHDX_ADDRESS,
      amount: shdxNeeded,
      decimals: shdxDecimals,
      displayAmount: formatUnits(shdxNeeded, shdxDecimals),
    }
  }

  const usdtDecimals = Number(
    await client.readContract({
      address: BSC_USDT,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }),
  )
  const usdtNeeded = parseUnits(usdValue.toFixed(usdtDecimals), usdtDecimals)
  const usdtBalance = (await client.readContract({
    address: BSC_USDT,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })) as bigint

  if (usdtBalance >= usdtNeeded) {
    return {
      token: 'USDT',
      tokenAddress: BSC_USDT,
      amount: usdtNeeded,
      decimals: usdtDecimals,
      displayAmount: formatUnits(usdtNeeded, usdtDecimals),
    }
  }

  const usdcDecimals = Number(
    await client.readContract({
      address: BSC_USDC,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }),
  )
  const usdcNeeded = parseUnits(usdValue.toFixed(usdcDecimals), usdcDecimals)
  const usdcBalance = (await client.readContract({
    address: BSC_USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })) as bigint

  if (usdcBalance >= usdcNeeded) {
    return {
      token: 'USDC',
      tokenAddress: BSC_USDC,
      amount: usdcNeeded,
      decimals: usdcDecimals,
      displayAmount: formatUnits(usdcNeeded, usdcDecimals),
    }
  }

  const bnbBalance = await client.getBalance({ address: userAddress })
  const bnbNeeded = parseUnits((usdValue * 0.004).toFixed(18), 18)

  return {
    token: 'BNB',
    amount: bnbNeeded,
    decimals: 18,
    displayAmount: formatUnits(bnbNeeded, 18),
  }
}

export { ERC20_ABI, STAKE_ADDRESS }
