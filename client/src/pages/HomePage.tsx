import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
}

function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    const apiUrl = `http://localhost:3000/api/courses?sortBy=${sortBy}&order=${order}&search=${debouncedSearch}`;

    axios.get(apiUrl)
      .then(response => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Błąd pobierania kursów:", error);
        setLoading(false);
      });
  }, [sortBy, order, debouncedSearch]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    switch (value) {
      case 'newest': setSortBy('createdAt'); setOrder('desc'); break;
      case 'oldest': setSortBy('createdAt'); setOrder('asc'); break;
      case 'priceAsc': setSortBy('price'); setOrder('asc'); break;
      case 'priceDesc': setSortBy('price'); setOrder('desc'); break;
      case 'titleAsc': setSortBy('title'); setOrder('asc'); break;
      case 'titleDesc': setSortBy('title'); setOrder('desc'); break;
      default: setSortBy('createdAt'); setOrder('desc');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  if (loading && courses.length === 0 && !searchTerm) return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-4xl"
      >
        ⏳
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Odkryj potęgę <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Nauki</span> 🚀
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Platforma nowej generacji. Wybierz kurs, szlifuj swoje umiejętności i dołącz do najlepszych w branży.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/70 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-white/50 gap-4"
      >
        <div className="text-gray-500 font-medium w-full md:w-auto text-center md:text-left px-2">
          Znaleziono: <motion.span key={courses.length} initial={{ scale: 1.5, color: '#4f46e5' }} animate={{ scale: 1, color: '#4f46e5' }} className="font-bold">{courses.length}</motion.span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Czego chcesz się nauczyć?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent block w-full pl-11 p-3 shadow-sm outline-none transition-all placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <select 
              onChange={handleSortChange}
              defaultValue="newest"
              className="bg-white/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-3 cursor-pointer shadow-sm outline-none transition-all hover:bg-white"
            >
              <option value="newest">🗓️ Najnowsze</option>
              <option value="oldest">🗓️ Najstarsze</option>
              <option value="priceAsc">💰 Najtańsze</option>
              <option value="priceDesc">💰 Najdroższe</option>
              <option value="titleAsc">🔤 Od A do Z</option>
              <option value="titleDesc">🔤 Od Z do A</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}`}
      >
        {courses.map(course => (
          <motion.div 
            key={course.id} 
            variants={itemVariants}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group"
          >
            
            <div className="h-52 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
              <motion.span 
                whileHover={{ scale: 1.2, rotate: 5 }}
                className="text-white text-6xl opacity-40 group-hover:opacity-60 transition-opacity drop-shadow-lg"
              >
                📚
              </motion.span>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                {course.description || "Brak opisu."}
              </p>
              
              <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                <span className={`text-xl font-black ${course.price === 0 ? 'text-green-500' : 'text-gray-900'}`}>
                  {course.price === 0 ? "ZA DARMO" : `${course.price} PLN`}
                </span>

                <Link 
                  to={`/course/${course.id}`} 
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-md hover:shadow-indigo-200"
                >
                  Zobacz →
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {!loading && courses.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-20 bg-white/50 backdrop-blur-sm p-12 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto"
        >
          <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl block mb-6">🕵️‍♂️</motion.span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Nic nie znaleźliśmy</h3>
          <p className="text-gray-500">Spróbuj wpisać inne słowo kluczowe lub zmień kryteria filtrowania.</p>
        </motion.div>
      )}

    </div>
  );
}

export default HomePage;