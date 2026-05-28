import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Placeholder page components — to be built out in future phases
const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <h1 className="text-3xl font-bold">QuantPOS — Login</h1>
  </div>
)

const DashboardPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <h1 className="text-3xl font-bold">Dashboard</h1>
  </div>
)

const POSPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <h1 className="text-3xl font-bold">POS Terminal</h1>
  </div>
)

const InventoryPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <h1 className="text-3xl font-bold">Inventory</h1>
  </div>
)

const AIRestockPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <h1 className="text-3xl font-bold">AI Restock Agent</h1>
  </div>
)

const BillingPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <h1 className="text-3xl font-bold">Billing & Subscription</h1>
  </div>
)

// Guard for authenticated routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <PrivateRoute>
            <POSPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <InventoryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/ai-restock"
        element={
          <PrivateRoute>
            <AIRestockPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute>
            <BillingPage />
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
