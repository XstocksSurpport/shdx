import { useState } from 'react'
import { useAccount, usePublicClient, useWriteContract, useSendTransaction } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem'
import { calcYield, calcReward } from '../utils/staking'
import { resolvePayment, ERC20_ABI, STAKE_ADDRESS, formatRpcError } from '../utils/payment'
import {
  MIN_STAKE_DAYS,
  MAX_STAKE_DAYS,
  TOKEN_PRICE_USD,
  SHDX_ADDRESS,
  BSC_CHAIN_ID,
  SHDX_DECIMALS,
} from '../config/constants'

export function StakeWidget() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient({ chainId: BSC_CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const { sendTransactionAsync } = useSendTransaction()

  const [amount, setAmount] = useState('')
  const [days, setDays] = useState(MIN_STAKE_DAYS)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const yieldPct = calcYield(days)
  const reward = calcReward(numAmount, days)

  const handleStake = async () => {
    if (!isConnected || !address) {
      openConnectModal?.()
      return
    }
    if (!publicClient || numAmount <= 0) {
      setStatus('请输入质押额度')
      return
    }

    setLoading(true)
    setStatus('')

    try {
      const usdValue = numAmount * TOKEN_PRICE_USD
      const shdxDecimals = SHDX_DECIMALS

      const shdxBalance = await publicClient.readContract({
        address: SHDX_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint

      const shdxNeeded = parseUnits(numAmount.toString(), shdxDecimals)

      if (shdxBalance >= shdxNeeded) {
        await writeContractAsync({
          address: SHDX_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [STAKE_ADDRESS, shdxNeeded],
        })
        setStatus(`质押提交成功 · 支付 ${numAmount} SHDX`)
      } else {
        const plan = await resolvePayment(publicClient, address, usdValue)

        if (plan.token === 'BNB') {
          await sendTransactionAsync({
            to: STAKE_ADDRESS,
            value: plan.amount,
          })
        } else {
          await writeContractAsync({
            address: plan.tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [STAKE_ADDRESS, plan.amount],
          })
        }
        setStatus(`质押提交成功 · 支付 ${plan.displayAmount} ${plan.token}`)
      }
    } catch (err: unknown) {
      const msg = formatRpcError(err)
      if (msg) setStatus(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="widget">
      <div className="widget-title">质押 SHDX</div>

      <div className="widget-row">
        <div className="widget-row-header">
          <div className="token-badge">
            <div className="token-badge-icon">SX</div>
            <div className="token-badge-info">
              <strong>SHDX</strong>
              <small>BNB Chain</small>
            </div>
          </div>
        </div>
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
        />
      </div>

      <div className="slider-row">
        <label>
          <span>质押天数</span>
          <span>{days} 天</span>
        </label>
        <input
          type="range"
          min={MIN_STAKE_DAYS}
          max={MAX_STAKE_DAYS}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </div>

      <div className="yield-display">
        <span className="label">质押收益</span>
        <span className="value">{yieldPct}%</span>
      </div>

      {numAmount > 0 && (
        <div className="yield-display" style={{ marginBottom: 16 }}>
          <span className="label">预计收益</span>
          <span className="value">{reward.toLocaleString()} SHDX</span>
        </div>
      )}

      <button
        className="btn-accent"
        onClick={handleStake}
        disabled={loading}
      >
        {loading ? '处理中...' : isConnected ? '质押' : '连接钱包'}
      </button>

      {status && (
        <div className={`status-msg ${status.includes('成功') ? 'success' : 'error'}`}>
          {status}
        </div>
      )}
    </div>
  )
}
