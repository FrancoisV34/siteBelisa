import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import Avatar from './Avatar.jsx'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const handleLogout = async () => {
    setOpen(false)
    await logout()
  }

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utilisateur"
      >
        <Avatar displayName={user.display_name} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-menu-dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
          >
            <div className="user-menu-header">
              <span className="user-menu-name">{user.display_name}</span>
              <span className="user-menu-email">{user.email}</span>
            </div>
            <div className="user-menu-divider" />
            <Link to="/profil" className="user-menu-item" role="menuitem">
              <User size={16} />
              <span>Mon profil</span>
            </Link>
            <button type="button" className="user-menu-item" role="menuitem" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
