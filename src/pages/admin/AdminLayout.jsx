import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function AdminLayout() {
  const { user } = useAuth()
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Administration</h2>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>Articles</NavLink>
          <NavLink to="/admin/new" className={({ isActive }) => isActive ? 'active' : ''}>Nouvel article</NavLink>
          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>Utilisateurs</NavLink>
              <NavLink to="/admin/moderation" className={({ isActive }) => isActive ? 'active' : ''}>Modération</NavLink>
            </>
          )}
        </nav>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
