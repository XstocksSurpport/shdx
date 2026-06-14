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
        ShadowX 是独立发起的衍生迷因代币，部署于币安智能链，以匿名方式发行。
        社区与公开渠道信息有限，创始团队未披露身份。叙事围绕社交媒体上
        「算法埋没与放大」议题展开，属于社区驱动的实验性代币。
      </p>
      <p>
        项目聚焦社会话题表达与流动性探索，面向 BSC 社区参与者及算法议题关注者。
      </p>
    </div>
  )
}
