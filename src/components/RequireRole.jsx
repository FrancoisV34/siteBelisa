import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>Chargement…</div>

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (!roles.includes(user.role)) {
    return (
      <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1>Accès refusé</h1>
        <p>Vous n'avez pas les droits nécessaires.</p>
      </div>
    )
  }
  return children
}
