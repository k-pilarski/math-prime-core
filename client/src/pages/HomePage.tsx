import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

  if (loading && courses.length === 0 && !searchTerm) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-xl text-indigo-600 font-semibold animate-pulse">Ładowanie kursów...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Witaj w <span className="text-indigo-600">MathPrime</span> 🚀
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Najlepsza platforma do nauki matematyki i programowania. Wybierz kurs i zacznij naukę już dziś.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        
        <div className="text-gray-600 font-medium w-full md:w-auto text-center md:text-left">
          Znaleziono: <span className="text-indigo-600 font-bold">{courses.length}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              🔍
            </div>
            <input
              type="text"
              placeholder="Szukaj kursu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 shadow-sm outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label htmlFor="sortSelect" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Sortuj:
            </label>
            <select 
              id="sortSelect"
              onChange={handleSortChange}
              defaultValue="newest"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 cursor-pointer shadow-sm outline-none"
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
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}`}>
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-100 flex flex-col">
            
            <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-5xl opacity-30">📚</span>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                {course.description || "Brak opisu."}
              </p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className={`text-lg font-bold ${course.price === 0 ? 'text-green-600' : 'text-indigo-600'}`}>
                  {course.price === 0 ? "ZA DARMO 🎁" : `${course.price} PLN`}
                </span>

                <Link 
                  to={`/course/${course.id}`} 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition"
                >
                  Zobacz więcej →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && courses.length === 0 && (
        <div className="text-center text-gray-500 mt-16 bg-gray-50 p-8 rounded-xl border border-gray-200">
          <span className="text-4xl block mb-4">🕵️‍♂️</span>
          <p className="text-lg font-medium text-gray-900">Nie znaleziono kursów pasujących do Twojego wyszukiwania.</p>
          <p className="text-gray-500 mt-1">Spróbuj wpisać inne słowo kluczowe lub zmień kryteria sortowania.</p>
        </div>
      )}

    </div>
  );
}

export default HomePage;