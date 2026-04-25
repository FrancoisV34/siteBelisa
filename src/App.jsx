import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Oeuvres from './pages/Oeuvres.jsx'
import Blog from './pages/Blog.jsx'
import Post from './pages/Post.jsx'
import Guestbook from './pages/Guestbook.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import RequireRole from './components/RequireRole.jsx'
import NotFound from './pages/NotFound.jsx'

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const PostsList = lazy(() => import('./pages/admin/PostsList.jsx'))
const PostEditor = lazy(() => import('./pages/admin/PostEditor.jsx'))
const Users = lazy(() => import('./pages/admin/Users.jsx'))
const Moderation = lazy(() => import('./pages/admin/Moderation.jsx'))

const AdminFallback = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>Chargement…</div>
)

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
}

function App() {
  const location = useLocation()

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/oeuvres" element={<Oeuvres />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Post />} />
              <Route path="/livre-d-or" element={<Guestbook />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={
                <RequireRole roles={['admin', 'author']}>
                  <Suspense fallback={<AdminFallback />}><AdminLayout /></Suspense>
                </RequireRole>
              }>
                <Route index element={<Suspense fallback={<AdminFallback />}><PostsList /></Suspense>} />
                <Route path="new" element={<Suspense fallback={<AdminFallback />}><PostEditor /></Suspense>} />
                <Route path="posts/:id" element={<Suspense fallback={<AdminFallback />}><PostEditor /></Suspense>} />
                <Route path="users" element={
                  <RequireRole roles={['admin']}>
                    <Suspense fallback={<AdminFallback />}><Users /></Suspense>
                  </RequireRole>
                } />
                <Route path="moderation" element={
                  <RequireRole roles={['admin']}>
                    <Suspense fallback={<AdminFallback />}><Moderation /></Suspense>
                  </RequireRole>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

export default App
