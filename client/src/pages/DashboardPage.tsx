import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface UserData {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    axios.get('http://localhost:3000/api/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      setUser(response.data.user);
    })
    .catch(err => {
      console.error(err);
      setError("Nie udało się pobrać danych. Sesja mogła wygasnąć.");
    });
  }, [navigate]);

  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!user) return <div style={{ padding: '20px' }}>Ładowanie danych...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Panel Użytkownika (Dashboard)</h1>
      <p style={{ color: 'green' }}>✅ Masz dostęp do strefy chronionej!</p>
      
      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
        <h3>Twoje dane z serwera:</h3>
        <p><strong>Twoje ID:</strong> {user.userId}</p>
        <p><strong>Rola:</strong> {user.role}</p>
        <p><strong>Wygasa (Timestamp):</strong> {user.exp}</p>
      </div>

      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Tę stronę widzą tylko osoby z ważnym Tokenem JWT.
      </p>
    </div>
  );
}

export default DashboardPage;