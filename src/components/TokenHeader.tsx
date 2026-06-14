import { useState } from 'react'
import { SHDX_ADDRESS, TOKEN_PRICE_USD } from '../config/constants'

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function TokenHeader() {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    await navigator.clipboard.writeText(SHDX_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="token-header">
      <div className="container">
        <div className="token-identity">
          <div className="token-avatar">SX</div>
          <div className="token-name">
            <h1>
              SHDX <span>ShadowX</span>
            </h1>
            <div className="token-address">
              {truncateAddress(SHDX_ADDRESS)}
              <button className="copy-btn" onClick={copyAddress} title="复制">
                {copied ? '✓' : '⎘'}
              </button>
              <span className="chain-badge">
                <span className="chain-dot" />
                BNB Chain
              </span>
            </div>
          </div>
        </div>
        <div className="token-price">
          <div className="price">${TOKEN_PRICE_USD.toFixed(6)}</div>
          <div className="change">+263.51%</div>
          <div className="sub">1 SHDX = ${TOKEN_PRICE_USD} USD · 1D</div>
        </div>
        <div className="token-stats">
          <div className="stat-item">
            <label>24h 最高</label>
            <span>$0.001892</span>
          </div>
          <div className="stat-item">
            <label>24h 最低</label>
            <span>$0.000421</span>
          </div>
          <div className="stat-item">
            <label>24h 成交量</label>
            <span>12.4M SHDX</span>
          </div>
        </div>
      </div>
    </section>
  )
}
