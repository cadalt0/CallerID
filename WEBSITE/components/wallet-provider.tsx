"use client"

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Configure Sui networks
const networks = {
  localnet: { url: getFullnodeUrl('localnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
}

// Default network (can be changed via environment variable)
const defaultNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as keyof typeof networks) || 'testnet'

interface WalletProviderWrapperProps {
  children: React.ReactNode
}

export function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <WalletProvider
          autoConnect={true}
          storageKey="sui-wallet"
          storage={typeof window !== 'undefined' ? window.localStorage : undefined}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

