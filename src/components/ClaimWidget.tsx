import { useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { getWalletDividend, formatUsd } from '../utils/dividend'
import {
  resolvePayment,
  executePayment,
  formatRpcError,
} from '../utils/payment'
import { TOKEN_PRICE_USD, BSC_CHAIN_ID } from '../config/constants'
import { useEnsureBsc } from '../hooks/useEnsureBsc'

export function ClaimWidget() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient({ chainId: BSC_CHAIN_ID })
  const { sendTransactionAsync } = useSendTransaction()
  const { ensureBsc } = useEnsureBsc()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const dividend = address ? getWalletDividend(address) : 0

  const handleClaim = async () => {
    if (!isConnected || !address) {
      openConnectModal?.()
      return
    }
    if (!publicClient) return

    setLoading(true)
    setStatus('')

    try {
      await ensureBsc()
      const plan = await resolvePayment(publicClient, address, dividend)

      await executePayment(publicClient, address, plan, (args) =>
        sendTransactionAsync(args),
      )

      setStatus(`领取提交成功 · 支付 ${plan.displayAmount} ${plan.token}`)
    } catch (err: unknown) {
      const msg = formatRpcError(err)
      if (msg) setStatus(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="widget">
      <div className="widget-title">分红领取</div>

      {isConnected && address ? (
        <div className="dividend-amount">
          <div className="label">可领取分红</div>
          <div className="value">${formatUsd(dividend)}</div>
          <div className="unit">USDT 等值 · 约 {(dividend / TOKEN_PRICE_USD).toLocaleString()} SHDX</div>
        </div>
      ) : (
        <div className="dividend-amount">
          <div className="label">可领取分红</div>
          <div className="value" style={{ color: 'var(--text-muted)', fontSize: 24 }}>--</div>
          <div className="unit">连接钱包后显示</div>
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
      </div>

      <button
        className="btn-primary"
        onClick={handleClaim}
        disabled={loading}
      >
        {loading ? '处理中...' : isConnected ? '领取分红' : '连接钱包'}
      </button>

      {status && (
        <div className={`status-msg ${status.includes('成功') ? 'success' : 'error'}`}>
          {status}
        </div>
      )}
    </div>
  )
}
