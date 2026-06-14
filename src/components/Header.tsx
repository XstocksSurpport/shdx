import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">SX</div>
          ShadowX
        </Link>
        <nav className="nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            分红领取
          </Link>
          <Link to="/stake" className={location.pathname === '/stake' ? 'active' : ''}>
            质押
          </Link>
        </nav>
        <div className="header-actions">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      </div>
    </header>
  )
}
