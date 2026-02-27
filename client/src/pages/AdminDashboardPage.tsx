import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalPurchases: number;
  recentUsers: Array<{ id: string; email: string; nickname: string | null; createdAt: string }>;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetchError, setFetchError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          navigate('/');
        } else {
          setFetchError('Nie udało się pobrać statystyk.');
        }
      }
    };

    fetchStats();
  }, [navigate]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsCreating(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://localhost:3000/api/courses', {
        title,
        description,
        price: Number(price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Kurs został utworzony!");
      
      setTitle('');
      setDescription('');
      setPrice('');
      
      const statsResponse = await axios.get('http://localhost:3000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);

    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setFormError("Brak uprawnień administratora!");
      } else {
        setFormError("Błąd podczas tworzenia kursu.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (fetchError) return <div className="p-8 text-red-500 text-center font-bold">{fetchError}</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">Ładowanie panelu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">🛠️ Panel Administratora</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-lg text-2xl">👥</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Użytkownicy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-lg text-2xl">📚</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Wszystkie Kursy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-yellow-100 text-yellow-600 rounded-lg text-2xl">💳</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sprzedane Dostępy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Ostatnio zarejestrowani</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {stats.recentUsers.map((user) => (
                <li key={user.id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                  <div>
                    <p className="font-medium text-gray-900">{user.nickname || 'Brak nicku'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                </li>
              ))}
              {stats.recentUsers.length === 0 && (
                <li className="p-6 text-center text-gray-500">Brak użytkowników.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">➕ Dodaj nowy kurs</h2>
            </div>
            <div className="p-6">
              {formError && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">{formError}</div>}
              
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł kursu</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cena (PLN)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(Number(e.target.value))} 
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 mt-4"
                >
                  {isCreating ? 'Tworzenie...' : 'Stwórz Kurs'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AdminDashboardPage;