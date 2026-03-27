import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30 * 1000,              // données fraîches 30s
      gcTime: 10 * 60 * 1000,
      refetchInterval: 60 * 1000,        // polling automatique toutes les 60s
      refetchIntervalInBackground: false, // pause quand l'onglet est inactif
    },
  },
})

const loader = document.getElementById('app-loader');
if (loader) loader.remove();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
