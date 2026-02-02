import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', background: '#f0f0f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', fontWeight: 'bold', color: 'black' }}>
            MathPrime
          </Link>
          {isAuthenticated && (
             <Link to="/dashboard" style={{ marginRight: '15px', textDecoration: 'none', color: '#333' }}>
               Mój Panel
             </Link>
          )}
        </div>

        <div>
          {isAuthenticated ? (
            <>
              <span style={{ marginRight: '15px', color: '#555' }}>Witaj!</span>
              <button 
                onClick={handleLogout} 
                style={{ padding: '8px 15px', background: 'red', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: '15px', textDecoration: 'none', color: 'green' }}>Logowanie</Link>
              <Link to="/register" style={{ textDecoration: 'none', color: 'blue' }}>Rejestracja</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/course/:id" element={<CoursePage />} />
        <Route path="/" element={<div style={{ padding: '20px' }}>
            <h1>Strona Główna</h1>
            {isAuthenticated ? <p>Przejdź do <Link to="/dashboard">Panelu Użytkownika</Link>.</p> : <p>Zaloguj się, aby zobaczyć treść.</p>}
          </div>} 
        />
        
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
        />
        
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;