import { Header } from '../components/Header'
import { TokenHeader } from '../components/TokenHeader'
import { Breadcrumb, ProjectInfo } from '../components/Layout'
import { StakeWidget } from '../components/StakeWidget'
import { useForceBsc } from '../hooks/useForceBsc'

export function StakePage() {
  useForceBsc()

  return (
    <div className="page">
      <Header />
      <Breadcrumb current="质押" />
      <TokenHeader />
      <main className="main-content">
        <div className="container main-grid">
          <ProjectInfo />
          <StakeWidget />
        </div>
      </main>
    </div>
  )
}
