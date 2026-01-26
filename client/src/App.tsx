import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', background: '#f0f0f0', marginBottom: '20px' }}>
        <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', fontWeight: 'bold' }}>Strona Główna</Link>
        <Link to="/register" style={{ textDecoration: 'none', color: 'blue' }}>Rejestracja</Link>
      </nav>

      <Routes>
        <Route path="/" element={<div style={{ padding: '20px' }}><h1>Witaj na platformie kursowej!</h1><p>Wybierz rejestrację z menu.</p></div>} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;