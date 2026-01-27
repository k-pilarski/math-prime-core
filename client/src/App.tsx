import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', background: '#f0f0f0', marginBottom: '20px' }}>
        <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', fontWeight: 'bold' }}>Strona Główna</Link>
        <Link to="/register" style={{ marginRight: '15px', textDecoration: 'none', color: 'blue' }}>Rejestracja</Link>
        <Link to="/login" style={{ textDecoration: 'none', color: 'green' }}>Logowanie</Link>
      </nav>

      <Routes>
        <Route path="/" element={<div style={{ padding: '20px' }}><h1>Witaj na platformie kursowej!</h1></div>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;