import { Header } from '../components/Header'
import { TokenHeader } from '../components/TokenHeader'
import { Breadcrumb, ProjectInfo } from '../components/Layout'
import { ClaimWidget } from '../components/ClaimWidget'
import { useForceBsc } from '../hooks/useForceBsc'

export function ClaimPage() {
  useForceBsc()

  return (
    <div className="page">
      <Header />
      <Breadcrumb current="分红领取" />
      <TokenHeader />
      <main className="main-content">
        <div className="container main-grid">
          <ProjectInfo />
          <ClaimWidget />
        </div>
      </main>
    </div>
  )
}
