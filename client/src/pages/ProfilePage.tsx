import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  nickname: string | null;
}

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.get('http://localhost:3000/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setUser(res.data.user);
      setNicknameInput(res.data.user.nickname || '');
      setLoading(false);
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (nicknameInput.trim().length < 3) {
        setError('Nick musi mieć co najmniej 3 znaki.');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const res = await axios.put('http://localhost:3000/api/user/profile', 
            { nickname: nicknameInput },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(res.data.message || 'Profil zaktualizowany!');
        setUser(res.data.user);
    } catch (err: any) {
        setError(err.response?.data?.error || 'Błąd aktualizacji profilu.');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Ładowanie profilu...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-4 mb-8 border-b pb-6">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.nickname ? user.nickname.substring(0, 2).toUpperCase() : user?.email.substring(0, 2).toUpperCase()}
        </div>
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Moje Konto</h1>
            <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
          <form onSubmit={handleUpdateProfile} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-700 mb-4">Ustawienia profilu</h3>
              
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twój pseudonim (wyświetlany w komentarzach)
                  </label>
                  <input 
                      type="text" 
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder="Np. MathNinja99"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Musi być unikalny i mieć min. 3 znaki.</p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>}
              {message && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{message}</div>}

              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
                  Zapisz zmiany
              </button>
          </form>
      </div>
    </div>
  );
}

export default ProfilePage;