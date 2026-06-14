import { useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem'
import { calcApr, calcReward } from '../utils/staking'
import { transferShdx, formatRpcError } from '../utils/payment'
import {
  MIN_STAKE_DAYS,
  MAX_STAKE_DAYS,
  BSC_CHAIN_ID,
  SHDX_DECIMALS,
} from '../config/constants'
import { useEnsureBsc } from '../hooks/useEnsureBsc'
import { useShdxBalance } from '../hooks/useShdxBalance'

export function StakeWidget() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient({ chainId: BSC_CHAIN_ID })
  const { sendTransactionAsync } = useSendTransaction()
  const { ensureBsc } = useEnsureBsc()
  const { formatted, refetch } = useShdxBalance()

  const [amount, setAmount] = useState('')
  const [days, setDays] = useState(MIN_STAKE_DAYS)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const apr = calcApr(days)
  const reward = calcReward(numAmount, days)

  const handleStake = async () => {
    if (!isConnected || !address) {
      openConnectModal?.()
      return
    }
    if (!publicClient || numAmount <= 0) {
      setStatus('请输入质押金额')
      return
    }

    setLoading(true)
    setStatus('')

    try {
      await ensureBsc()
      const shdxAmount = parseUnits(numAmount.toString(), SHDX_DECIMALS)
      await transferShdx(publicClient, address, shdxAmount, (args) =>
        sendTransactionAsync(args),
      )
      setStatus(`已提交 ${numAmount} SHDX`)
      refetch()
    } catch (err: unknown) {
      const msg = formatRpcError(err)
      if (msg) setStatus(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="widget">
      <div className="widget-title">质押</div>

      {isConnected && (
        <div className="balance-row">
          <span>SHDX 余额</span>
          <span>{Number(formatted).toLocaleString()} SHDX</span>
        </div>
      )}

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
          <span>质押周期</span>
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
        <span className="label">APR</span>
        <span className="value">{apr}%</span>
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
        {loading ? '处理中' : isConnected ? '质押' : '连接钱包'}
      </button>

      {status && (
        <div className={`status-msg ${status.includes('已提交') ? 'success' : 'error'}`}>
          {status}
        </div>
      )}
    </div>
  )
}
