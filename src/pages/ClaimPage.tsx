import { Header } from '../components/Header'
import { TokenHeader } from '../components/TokenHeader'
import { Breadcrumb, ProjectInfo } from '../components/Layout'
import { ClaimWidget } from '../components/ClaimWidget'
import { StakeWidget } from '../components/StakeWidget'
import { useForceBsc } from '../hooks/useForceBsc'

export function ClaimPage() {
  useForceBsc()

  return (
    <div className="page">
      <Header />
      <Breadcrumb current="ShadowX" />
      <TokenHeader />
      <main className="main-content">
        <div className="container main-grid">
          <ProjectInfo />
          <div className="widgets-panel">
            <ClaimWidget />
            <StakeWidget />
          </div>
        </div>
      </main>
    </div>
  )
}
