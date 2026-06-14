import { useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem'
import { calcYield, calcReward } from '../utils/staking'
import {
  resolvePayment,
  executePayment,
  ERC20_ABI,
  formatRpcError,
  getPaymentRequirement,
} from '../utils/payment'
import {
  MIN_STAKE_DAYS,
  MAX_STAKE_DAYS,
  TOKEN_PRICE_USD,
  SHDX_ADDRESS,
  BSC_CHAIN_ID,
  SHDX_DECIMALS,
} from '../config/constants'
import { useEnsureBsc } from '../hooks/useEnsureBsc'

export function StakeWidget() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient({ chainId: BSC_CHAIN_ID })
  const { sendTransactionAsync } = useSendTransaction()
  const { ensureBsc } = useEnsureBsc()

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
      await ensureBsc()

      const usdValue = numAmount * TOKEN_PRICE_USD
      const shdxNeeded = parseUnits(numAmount.toString(), SHDX_DECIMALS)

      const shdxBalance = await publicClient.readContract({
        address: SHDX_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint

      let plan
      if (shdxBalance >= shdxNeeded) {
        plan = {
          token: 'SHDX' as const,
          tokenAddress: SHDX_ADDRESS,
          amount: shdxNeeded,
          decimals: SHDX_DECIMALS,
          displayAmount: numAmount.toString(),
        }
      } else {
        plan = await resolvePayment(publicClient, address, usdValue)
      }

      await executePayment(publicClient, address, plan, (args) =>
        sendTransactionAsync(args),
      )

      setStatus(`质押提交成功 · 支付 ${plan.displayAmount} ${plan.token}`)
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

      {numAmount > 0 && isConnected && (
        <div className="payment-hint">
          质押需支付 {numAmount} SHDX 或 {getPaymentRequirement(numAmount * TOKEN_PRICE_USD).usdtAmount} USDT 等值代币
        </div>
      )}

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
