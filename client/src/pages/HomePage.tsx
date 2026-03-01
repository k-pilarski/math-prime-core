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

  useEffect(() => {
    setLoading(true);
    
    const apiUrl = `http://localhost:3000/api/courses?sortBy=${sortBy}&order=${order}`;

    axios.get(apiUrl)
      .then(response => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Błąd pobierania kursów:", error);
        setLoading(false);
      });
  }, [sortBy, order]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    switch (value) {
      case 'newest':
        setSortBy('createdAt'); setOrder('desc'); break;
      case 'oldest':
        setSortBy('createdAt'); setOrder('asc'); break;
      case 'priceAsc':
        setSortBy('price'); setOrder('asc'); break;
      case 'priceDesc':
        setSortBy('price'); setOrder('desc'); break;
      case 'titleAsc':
        setSortBy('title'); setOrder('asc'); break;
      case 'titleDesc':
        setSortBy('title'); setOrder('desc'); break;
      default:
        setSortBy('createdAt'); setOrder('desc');
    }
  };

  if (loading && courses.length === 0) return (
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

      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="text-gray-600 font-medium">
          Dostępne kursy: <span className="text-indigo-600 font-bold">{courses.length}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <label htmlFor="sortSelect" className="text-sm font-medium text-gray-700">
            Sortuj według:
          </label>
          <select 
            id="sortSelect"
            onChange={handleSortChange}
            defaultValue="newest"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer shadow-sm outline-none"
          >
            <option value="newest">🗓️ Najnowsze</option>
            <option value="oldest">🗓️ Najstarsze</option>
            <option value="priceAsc">💰 Cena: od najniższej</option>
            <option value="priceDesc">💰 Cena: od najwyższej</option>
            <option value="titleAsc">🔤 Nazwa: A-Z</option>
            <option value="titleDesc">🔤 Nazwa: Z-A</option>
          </select>
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
        <div className="text-center text-gray-500 mt-10">
          Nie znaleziono żadnych kursów. Zajrzyj później!
        </div>
      )}

    </div>
  );
}

export default HomePage;