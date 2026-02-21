import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import MyCoursesPage from './pages/MyCoursesPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-xl">Ładowanie aplikacji...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      
      <nav className="bg-white shadow-sm sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-500 transition">
                MathPrime 🚀
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                Katalog
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                    Dashboard
                  </Link>

                  <Link to="/profile" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                    Moje Konto
                  </Link>

                  <Link to="/my-courses" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                    Moje Kursy
                  </Link>

                  {userRole === 'ADMIN' && (
                    <Link to="/admin" className="text-red-500 hover:text-red-700 font-bold px-3 py-2 rounded-md text-sm transition border border-transparent hover:border-red-100">
                      ADMIN
                    </Link>
                  )}

                  <button 
                    onClick={handleLogout} 
                    className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition shadow-md"
                  >
                    Wyloguj
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                    Zaloguj
                  </Link>
                  <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition shadow-md">
                    Dołącz teraz
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<RegisterPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/course/:id" element={<CoursePage />} />
          <Route path="/my-courses" element={isAuthenticated ? <MyCoursesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          <Route 
            path="/admin" 
            element={isAuthenticated && userRole === 'ADMIN' ? <AdminPage /> : <Navigate to="/" />} 
          />
        </Routes>
      </main>

    </div>
  );
}

export default App;