import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Lesson {
  id: string;
  title: string;
  description: string;
  position: number;
  type: 'VIDEO' | 'TEXT';
  videoUrl?: string;
  content?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  lessons: Lesson[];
}

function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  const [hasAccess, setHasAccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonPos, setNewLessonPos] = useState(1);
  const [newLessonType, setNewLessonType] = useState<'VIDEO' | 'TEXT'>('VIDEO');
  const [newLessonUrl, setNewLessonUrl] = useState('');     
  const [newLessonContent, setNewLessonContent] = useState(''); 

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    } else {
      return null;
    }
  };

  const fetchCourseData = () => {
    axios.get(`http://localhost:3000/api/courses/${id}`)
      .then(response => {
        setCourse(response.data);
        if (!activeLesson && response.data.lessons && response.data.lessons.length > 0) {
          setActiveLesson(response.data.lessons[0]);
        }
        if (response.data.lessons) {
            setNewLessonPos(response.data.lessons.length + 1);
        }
      })
      .catch(error => console.error("Błąd pobierania kursu:", error));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchCourseData();

    if (token) {
      axios.get(`http://localhost:3000/api/purchases/check/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHasAccess(res.data.hasAccess))
      .catch(() => setHasAccess(false))
      .finally(() => setLoading(false));

      axios.get(`http://localhost:3000/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.user.role === 'ADMIN') {
          setIsAdmin(true);
          setHasAccess(true);
        }
      })
      .catch(() => {});
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleBuy = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Musisz być zalogowany!");
      navigate('/login');
      return;
    }
    if (!confirm(`Kupić kurs za ${course?.price} PLN?`)) return;

    try {
      setIsPurchasing(true);
      await axios.post('http://localhost:3000/api/purchases', { courseId: id }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Zakup udany!");
      setHasAccess(true);
      setIsPurchasing(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Błąd zakupu");
      setIsPurchasing(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    let finalVideoUrl = undefined;
    let finalContent = undefined;

    if (newLessonType === 'VIDEO') {
        const embedUrl = getYouTubeEmbedUrl(newLessonUrl);
        if (!embedUrl) {
            alert("Niepoprawny link do YouTube! Użyj formatu np. https://www.youtube.com/watch?v=identyfikator");
            return;
        }
        finalVideoUrl = embedUrl;
    } else {
        finalContent = newLessonContent;
    }

    try {
        await axios.post(`http://localhost:3000/api/courses/${id}/lessons`, {
            title: newLessonTitle,
            description: newLessonDesc,
            position: Number(newLessonPos),
            type: newLessonType,
            videoUrl: finalVideoUrl,
            content: finalContent
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("Lekcja dodana!");
        setNewLessonTitle('');
        setNewLessonUrl('');
        setNewLessonContent('');
        setNewLessonDesc('');
        fetchCourseData();
    } catch (err) {
        alert("Błąd dodawania lekcji");
        console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center text-xl">Ładowanie kursu...</div>;
  if (!course) return <div className="p-10 text-center text-xl text-red-500">Nie znaleziono kursu.</div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] font-sans bg-white">
      
      <div className="flex-3 p-6 overflow-y-auto w-full md:w-3/4">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">{course.title}</h1>
        <p className="text-gray-600 mb-6">{course.description}</p>
        <hr className="mb-6 border-gray-200" />

        {hasAccess ? (
          activeLesson ? (
            <div>
              <div className="mb-4">
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                  Lekcja {activeLesson.position}
                </span>
                <h2 className="text-2xl font-bold text-gray-800 mt-1">{activeLesson.title}</h2>
              </div>
              
              {activeLesson.type === 'VIDEO' ? (
                activeLesson.videoUrl ? (
                  <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={activeLesson.videoUrl} 
                      title="Video player" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                      frameBorder="0"
                    ></iframe>
                  </div>
                ) : (
                  <div className="p-10 bg-gray-100 rounded text-center">Brak wideo dla tej lekcji</div>
                )
              ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 prose max-w-none">
                    <div className="whitespace-pre-wrap text-lg text-gray-800 leading-relaxed font-serif">
                        {activeLesson.content || "Brak treści tekstowej."}
                    </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-2">Opis lekcji:</h4>
                <p className="text-gray-600">{activeLesson.description}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Ten kurs nie ma jeszcze dodanych lekcji.</p>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-yellow-50 border-2 border-yellow-200 border-dashed rounded-xl text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl text-yellow-800 font-bold mb-2">Treść zablokowana</h2>
            <p className="mb-6 text-yellow-700 max-w-md">
              Ta treść jest dostępna tylko dla kursantów. Odblokuj pełny dostęp już teraz.
            </p>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">{course.price} PLN</div>
            <button 
              onClick={handleBuy} 
              disabled={isPurchasing} 
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition shadow-lg transform hover:-translate-y-1"
            >
              {isPurchasing ? "Przetwarzanie..." : "KUP TERAZ I ODBLOKUJ"}
            </button>
          </div>
        )}

        {isAdmin && (
            <div className="mt-16 p-8 border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-xl">
                <h3 className="text-indigo-900 font-bold text-xl mb-6 flex items-center gap-2">
                    🔧 Panel Administratora: Dodaj Lekcję
                </h3>
                
                <form onSubmit={handleAddLesson} className="flex flex-col gap-5">
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100 hover:border-indigo-400 transition">
                            <input 
                                type="radio" 
                                name="type" 
                                value="VIDEO" 
                                checked={newLessonType === 'VIDEO'} 
                                onChange={() => setNewLessonType('VIDEO')}
                                className="w-4 h-4 text-indigo-600"
                            />
                            <span className="font-bold text-indigo-900">🎥 Wideo (YouTube)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100 hover:border-indigo-400 transition">
                            <input 
                                type="radio" 
                                name="type" 
                                value="TEXT" 
                                checked={newLessonType === 'TEXT'} 
                                onChange={() => setNewLessonType('TEXT')}
                                className="w-4 h-4 text-indigo-600"
                            />
                            <span className="font-bold text-indigo-900">📄 Artykuł (Tekst)</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-indigo-900 mb-1">Tytuł</label>
                            <input type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} required className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Temat lekcji" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-1">Nr</label>
                            <input type="number" value={newLessonPos} onChange={e => setNewLessonPos(Number(e.target.value))} className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>

                    {newLessonType === 'VIDEO' ? (
                        <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-1">Link do wideo</label>
                            <input 
                                type="text" 
                                placeholder="Wklej link z YouTube (np. https://www.youtube.com/watch?v=...)" 
                                value={newLessonUrl} 
                                onChange={e => setNewLessonUrl(e.target.value)} 
                                className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-indigo-500 mt-1">Obsługuje linki standardowe, skrócone (youtu.be) i embed.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-1">Treść lekcji</label>
                            <textarea 
                                placeholder="Wpisz treść artykułu tutaj..." 
                                value={newLessonContent} 
                                onChange={e => setNewLessonContent(e.target.value)} 
                                rows={8}
                                className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-sans"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-indigo-900 mb-1">Opis (opcjonalny)</label>
                        <input type="text" value={newLessonDesc} onChange={e => setNewLessonDesc(e.target.value)} className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    
                    <button type="submit" className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-bold self-start shadow-md transition">
                        + Dodaj Lekcję
                    </button>
                </form>
            </div>
        )}
      </div>

      <div className="w-full md:w-1/4 border-l border-gray-200 bg-gray-50 overflow-y-auto h-full">
        <div className="p-5 border-b border-gray-200 font-bold bg-white text-gray-800 sticky top-0 shadow-sm z-10">
          Program Kursu
        </div>
        <ul className="divide-y divide-gray-100">
          {course.lessons.map((lesson) => (
            <li 
              key={lesson.id} 
              onClick={() => hasAccess && setActiveLesson(lesson)} 
              className={`p-4 cursor-pointer transition flex items-start gap-3 group
                ${!hasAccess ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-white hover:shadow-md'}
                ${activeLesson?.id === lesson.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : 'border-l-4 border-transparent'}
              `}
            >
              <div className={`mt-1 p-1 rounded text-sm ${activeLesson?.id === lesson.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                {lesson.type === 'VIDEO' ? '🎥' : '📄'}
              </div>

              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Lekcja {lesson.position}
                </div>
                <div className={`font-medium ${activeLesson?.id === lesson.id ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {lesson.title}
                </div>
              </div>

              {!hasAccess && <span className="text-gray-400">🔒</span>}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default CoursePage;