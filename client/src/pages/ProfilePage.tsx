import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

interface UserProfile {
  email: string;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="text-4xl">
        ⏳
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative min-h-[calc(100vh-64px)]">
      
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-xl h-64 bg-indigo-400/10 blur-3xl rounded-full pointer-events-none -z-10"></div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4 bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-sm border border-white/50">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -5 }}
            className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg shadow-indigo-200"
          >
            {user?.nickname ? user.nickname.substring(0, 2).toUpperCase() : user?.email.substring(0, 2).toUpperCase()}
          </motion.div>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Witaj, {user?.nickname || 'Uczniu'}! 👋
            </h1>
            <p className="text-gray-500 text-lg">{user?.email}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>⚙️</span> Ustawienia konta
            </h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twój pseudonim (wyświetlany w komentarzach)
              </label>
              <input 
                type="text" 
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Np. MathNinja99"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2 ml-1">Musi być unikalny i mieć min. 3 znaki.</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 text-green-700 border border-green-100 rounded-xl text-sm flex items-center gap-2">
                <span>✅</span> {message}
              </motion.div>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-md text-lg"
            >
              Zapisz zmiany
            </motion.button>
          </form>
        </motion.div>

      </motion.div>
    </div>
  );
}

export default ProfilePage;