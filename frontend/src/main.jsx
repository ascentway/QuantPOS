import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
    },
  },
})

// Initialize global theme before React renders to prevent flash of wrong theme
let initialTheme = 'dark';
try {
  const stored = localStorage.getItem('quantpos-theme');
  const parsed = stored ? JSON.parse(stored) : null;
  initialTheme = parsed?.state?.theme ?? 'dark'; // default = dark
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ToastContainer theme={initialTheme} position="bottom-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
