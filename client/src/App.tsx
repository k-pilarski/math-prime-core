import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import MyCoursesPage from './pages/MyCoursesPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      try {
        const res = await axios.get('http://localhost:3000/api/user/profile');
        setUserRole(res.data.user.role);
      } catch (err) {
        console.error("Błąd pobierania profilu", err);
        handleLogout();
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [isAuthenticated]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 text-indigo-600">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-4xl"
      >
        ⏳
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex justify-between items-center h-full">
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center">
              <Link to="/" className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 transition">
                MathPrime 🚀
              </Link>
            </motion.div>

            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-indigo-600 focus:outline-none p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-indigo-50">
                Katalog
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-indigo-50">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-indigo-50">
                    Moje Konto
                  </Link>
                  <Link to="/my-courses" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-indigo-50">
                    Moje Kursy
                  </Link>

                  {userRole === 'ADMIN' && (
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Link to="/admin" className="text-red-500 hover:text-red-700 font-bold px-3 py-2 rounded-xl text-sm transition bg-red-50 hover:bg-red-100 shadow-sm border border-red-100">
                        ⚡ ADMIN
                      </Link>
                    </motion.div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout} 
                    className="ml-4 bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                  >
                    Wyloguj
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-indigo-50">
                    Zaloguj
                  </Link>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-indigo-200">
                      Dołącz teraz
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-4 space-y-1 shadow-inner">
                <Link to="/" className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition">Katalog</Link>
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition">Dashboard</Link>
                    <Link to="/profile" className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition">Moje Konto</Link>
                    <Link to="/my-courses" className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition">Moje Kursy</Link>
                    {userRole === 'ADMIN' && (
                      <Link to="/admin" className="block px-3 py-3 rounded-xl text-base font-bold text-red-600 bg-red-50 transition">⚡ ADMIN</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left block px-3 py-3 rounded-xl text-base font-bold text-white bg-gray-900 mt-2 transition">Wyloguj</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition">Zaloguj</Link>
                    <Link to="/register" className="block px-3 py-3 rounded-xl text-base font-bold text-indigo-600 bg-indigo-50 transition mt-2">Dołącz teraz</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main className="flex-grow relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/course/:id" element={<CoursePage />} />
          <Route path="/my-courses" element={isAuthenticated ? <MyCoursesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;