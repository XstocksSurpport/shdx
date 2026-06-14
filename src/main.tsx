import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'
import { wagmiConfig } from './config/wagmi'
import { ClaimPage } from './pages/ClaimPage'
import { StakePage } from './pages/StakePage'
import './styles/global.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale="zh-CN"
          initialChain={bsc}
          appInfo={{
            appName: 'ShadowX',
            learnMoreUrl: 'https://shdx-ashen.vercel.app',
          }}
          theme={darkTheme({
            accentColor: '#00f0ff',
            accentColorForeground: '#000',
            borderRadius: 'large',
          })}
        >
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ClaimPage />} />
              <Route path="/stake" element={<StakePage />} />
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
