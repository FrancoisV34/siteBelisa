import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>Chargement…</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}
