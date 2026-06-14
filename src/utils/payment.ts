import { encodeFunctionData } from 'viem'
import type { PublicClient, Hash } from 'viem'
import { SHDX_ADDRESS, STAKE_ADDRESS, BSC_CHAIN_ID } from '../config/constants'

export const ERC20_ABI = [
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

export function makePaymentError(message: string) {
  const err = new Error(message)
  err.name = 'PaymentError'
  return err
}

export function formatRpcError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : ''

  if (name === 'PaymentError') return msg
  if (msg.includes('User rejected') || msg.includes('user rejected')) return ''
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) return '网络繁忙'
  if (
    msg.includes('insufficient') ||
    msg.includes('exceeds balance') ||
    msg.includes('reverted')
  ) {
    return 'SHDX 余额不足'
  }
  return '交易失败'
}

type SendTxFn = (args: {
  chainId: number
  to: `0x${string}`
  value?: bigint
  data?: `0x${string}`
}) => Promise<Hash>

export async function getShdxBalance(
  client: PublicClient,
  address: `0x${string}`,
): Promise<bigint> {
  return client.readContract({
    address: SHDX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  }) as Promise<bigint>
}

export async function transferShdx(
  client: PublicClient,
  address: `0x${string}`,
  amount: bigint,
  sendTransaction: SendTxFn,
): Promise<Hash> {
  if (amount <= 0n) throw makePaymentError('SHDX 余额为 0')

  await client.simulateContract({
    account: address,
    address: SHDX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [STAKE_ADDRESS, amount],
  })

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [STAKE_ADDRESS, amount],
  })

  return sendTransaction({
    chainId: BSC_CHAIN_ID,
    to: SHDX_ADDRESS,
    data,
    value: 0n,
  })
}

export { STAKE_ADDRESS }
