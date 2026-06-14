interface BreadcrumbProps {
  current: string
}

export function Breadcrumb({ current }: BreadcrumbProps) {
  return (
    <div className="breadcrumb-bar">
      <div className="container">
        <div className="breadcrumb">
          Home &gt; ShadowX &gt; <span>{current}</span>
        </div>
        <div className="search-box">
          <span>🔍</span>
          <input type="text" placeholder="输入代币或合约地址" readOnly />
        </div>
      </div>
    </div>
  )
}

export function ProjectInfo() {
  return (
    <div className="info-panel">
      <h2>ShadowX (SHDX)</h2>
      <p>
        独立发起的衍生迷因代币，部署于币安智能链，匿名发行。
        叙事围绕「算法埋没与放大」议题，社区驱动实验性代币。
      </p>
    </div>
  )
}
