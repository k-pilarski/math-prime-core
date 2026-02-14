import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

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

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCoursePrice, setEditCoursePrice] = useState(0);

  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonPos, setLessonPos] = useState(1);
  const [lessonType, setLessonType] = useState<'VIDEO' | 'TEXT'>('VIDEO');
  const [lessonUrl, setLessonUrl] = useState('');      
  const [lessonContent, setLessonContent] = useState(''); 

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const fetchCourseData = (preserveActiveLesson = false) => {
    axios.get(`http://localhost:3000/api/courses/${id}`)
      .then(response => {
        setCourse(response.data);
        const lessons = response.data.lessons || [];
        
        if (preserveActiveLesson && activeLesson) {
             const found = lessons.find((l: Lesson) => l.id === activeLesson.id);
             setActiveLesson(found || lessons[0]);
        } else if (!activeLesson && lessons.length > 0) {
          setActiveLesson(lessons[0]);
        }
        
        if (!isEditingLesson) {
            setLessonPos(lessons.length + 1);
        }
      })
      .catch(error => console.error("Błąd pobierania kursu:", error));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchCourseData();

    if (token) {
      axios.get(`http://localhost:3000/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.user.role === 'ADMIN') {
          setIsAdmin(true);
          setHasAccess(true);
        } else {
             axios.get(`http://localhost:3000/api/purchases/check/${id}`, { headers: { Authorization: `Bearer ${token}` } })
             .then(accessRes => setHasAccess(accessRes.data.hasAccess));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    } else {
      axios.get(`http://localhost:3000/api/purchases/check/${id}`)
        .then(res => setHasAccess(res.data.hasAccess))
        .catch(() => setHasAccess(false))
        .finally(() => setLoading(false));
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

  const startEditingCourse = () => {
    if (!course) return;
    setEditCourseTitle(course.title);
    setEditCourseDesc(course.description);
    setEditCoursePrice(course.price);
    setIsEditingCourse(true);
  };

  const handleUpdateCourse = async () => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:3000/api/courses/${id}`, {
            title: editCourseTitle,
            description: editCourseDesc,
            price: editCoursePrice
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setIsEditingCourse(false);
        fetchCourseData(true);
        alert("Kurs zaktualizowany!");
    } catch (err) {
        alert("Błąd aktualizacji kursu");
    }
  };

  const startEditingLesson = (lesson: Lesson) => {
      setLessonTitle(lesson.title);
      setLessonDesc(lesson.description);
      setLessonPos(lesson.position);
      setLessonType(lesson.type);
      setLessonUrl(lesson.videoUrl || '');
      setLessonContent(lesson.content || '');
      setIsEditingLesson(true);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (lessonId: string) => {
      if(!confirm("Czy na pewno usunąć tę lekcję?")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:3000/api/courses/${id}/lessons/${lessonId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setActiveLesson(null);
          fetchCourseData();
          alert("Lekcja usunięta");
      } catch (err) {
          alert("Błąd usuwania");
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const markdownImage = `\n![Opis zdjęcia](${res.data.url})\n`;
      setLessonContent(prev => prev + markdownImage);
      
      alert("Zdjęcie wgrane! Kod dodany do treści.");

    } catch (err) {
      console.error(err);
      alert("Błąd wgrywania zdjęcia");
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    let finalVideoUrl = undefined;
    let finalContent = undefined;

    if (lessonType === 'VIDEO') {
        const embedUrl = getYouTubeEmbedUrl(lessonUrl);
        if (lessonUrl && !embedUrl) {
            alert("Niepoprawny link do YouTube!");
            return;
        }
        finalVideoUrl = embedUrl || lessonUrl; 
    } else {
        finalContent = lessonContent;
    }

    try {
        if (isEditingLesson && activeLesson) {
            await axios.put(`http://localhost:3000/api/courses/${id}/lessons/${activeLesson.id}`, {
                title: lessonTitle,
                description: lessonDesc,
                position: Number(lessonPos),
                type: lessonType,
                videoUrl: finalVideoUrl,
                content: finalContent
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Lekcja zaktualizowana!");
            setIsEditingLesson(false);
        } else {
            await axios.post(`http://localhost:3000/api/courses/${id}/lessons`, {
                title: lessonTitle,
                description: lessonDesc,
                position: Number(lessonPos),
                type: lessonType,
                videoUrl: finalVideoUrl,
                content: finalContent
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Lekcja dodana!");
        }

        setLessonTitle('');
        setLessonUrl('');
        setLessonContent('');
        setLessonDesc('');
        if (course?.lessons) setLessonPos(course.lessons.length + 2);
        fetchCourseData(true);
    } catch (err) {
        alert("Błąd zapisu lekcji");
        console.error(err);
    }
  };

  const cancelEditLesson = () => {
      setIsEditingLesson(false);
      setLessonTitle('');
      setLessonUrl('');
      setLessonContent('');
      setLessonDesc('');
      if (course?.lessons) setLessonPos(course.lessons.length + 1);
  };


  if (loading) return <div className="p-10 text-center text-xl">Ładowanie kursu...</div>;
  if (!course) return <div className="p-10 text-center text-xl text-red-500">Nie znaleziono kursu.</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] font-sans bg-white">
      
      <div className="flex-3 p-6 w-full md:w-3/4">
        
        {!isEditingCourse ? (
            <div className="mb-6 border-b border-gray-200 pb-6">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                    {isAdmin && (
                        <button onClick={startEditingCourse} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 transition">
                            ✏️ Edytuj Info
                        </button>
                    )}
                </div>
                <p className="text-gray-600 mt-2">{course.description}</p>
            </div>
        ) : (
            <div className="mb-6 bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                <h3 className="font-bold text-indigo-900 mb-4">Edycja Kursu</h3>
                <div className="space-y-4">
                    <input type="text" value={editCourseTitle} onChange={e => setEditCourseTitle(e.target.value)} className="w-full p-2 border rounded" placeholder="Tytuł" />
                    <textarea value={editCourseDesc} onChange={e => setEditCourseDesc(e.target.value)} className="w-full p-2 border rounded" placeholder="Opis" rows={3} />
                    <div className="flex items-center gap-2">
                        <span>Cena (PLN):</span>
                        <input type="number" value={editCoursePrice} onChange={e => setEditCoursePrice(Number(e.target.value))} className="p-2 border rounded w-32" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleUpdateCourse} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Zapisz</button>
                        <button onClick={() => setIsEditingCourse(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Anuluj</button>
                    </div>
                </div>
            </div>
        )}

        {isEditingLesson ? (
             <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200 mb-8">
                <h3 className="text-orange-900 font-bold text-xl mb-4">✏️ Edytujesz lekcję: {activeLesson?.title}</h3>
                <form onSubmit={handleSaveLesson} className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" checked={lessonType === 'VIDEO'} onChange={() => setLessonType('VIDEO')} /> Wideo</label>
                        <label className="flex items-center gap-2"><input type="radio" checked={lessonType === 'TEXT'} onChange={() => setLessonType('TEXT')} /> Tekst</label>
                     </div>
                     <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className="p-2 border rounded" placeholder="Tytuł" required />
                     
                     {lessonType === 'VIDEO' ? (
                        <input type="text" value={lessonUrl} onChange={e => setLessonUrl(e.target.value)} className="p-2 border rounded" placeholder="Link YouTube" />
                     ) : (
                        <>
                            <div className="mb-2">
                                <label className="cursor-pointer bg-orange-200 hover:bg-orange-300 text-orange-900 px-4 py-2 rounded inline-flex items-center gap-2 transition text-sm font-bold shadow-sm">
                                    <span>📷 Wgraj Zdjęcie / Wykres</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={10} className="p-2 border rounded font-mono" placeholder="Treść Markdown..." />
                        </>
                     )}
                     
                     <div className="flex gap-2">
                        <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-bold">Zapisz Zmiany</button>
                        <button type="button" onClick={cancelEditLesson} className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">Anuluj</button>
                     </div>
                </form>
             </div>
        ) : (
            hasAccess ? (
            activeLesson ? (
                <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">Lekcja {activeLesson.position}</span>
                        <h2 className="text-2xl font-bold text-gray-800 mt-1">{activeLesson.title}</h2>
                    </div>
                    
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button onClick={() => startEditingLesson(activeLesson)} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 text-sm font-bold transition">
                                ✏️ Edytuj
                            </button>
                            <button onClick={() => handleDeleteLesson(activeLesson.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm font-bold transition">
                                🗑️ Usuń
                            </button>
                        </div>
                    )}
                </div>
                
                {activeLesson.type === 'VIDEO' ? (
                    activeLesson.videoUrl ? (
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
                        <iframe width="100%" height="100%" src={activeLesson.videoUrl} title="Video" allowFullScreen frameBorder="0"></iframe>
                    </div>
                    ) : <div className="p-10 bg-gray-100 rounded text-center">Brak wideo.</div>
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <article className="prose lg:prose-xl max-w-none text-gray-800">
                            <ReactMarkdown>{activeLesson.content || "Brak treści."}</ReactMarkdown>
                        </article>
                    </div>
                )}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
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
                <div className="text-4xl font-extrabold text-gray-900 mb-6">{course.price === 0 ? "ZA DARMO" : `${course.price} PLN`}</div>
                <button onClick={handleBuy} disabled={isPurchasing} className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition shadow-lg">
                {isPurchasing ? "Przetwarzanie..." : (course.price === 0 ? "DOŁĄCZ ZA DARMO" : "KUP TERAZ")}
                </button>
            </div>
            )
        )}

        {isAdmin && !isEditingLesson && (
            <div className="mt-16 p-8 border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-xl">
                <h3 className="text-indigo-900 font-bold text-xl mb-6">➕ Dodaj Nową Lekcję</h3>
                <form onSubmit={handleSaveLesson} className="flex flex-col gap-5">
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100"><input type="radio" name="ntype" checked={lessonType === 'VIDEO'} onChange={() => setLessonType('VIDEO')} className="text-indigo-600"/> 🎥 Wideo</label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100"><input type="radio" name="ntype" checked={lessonType === 'TEXT'} onChange={() => setLessonType('TEXT')} className="text-indigo-600"/> 📄 Tekst</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required className="w-full p-2 border rounded" placeholder="Tytuł lekcji" />
                        </div>
                        <div>
                            <input type="number" value={lessonPos} onChange={e => setLessonPos(Number(e.target.value))} className="w-full p-2 border rounded" placeholder="Nr" />
                        </div>
                    </div>
                    
                    {lessonType === 'VIDEO' ? (
                        <input type="text" placeholder="Link YouTube" value={lessonUrl} onChange={e => setLessonUrl(e.target.value)} className="w-full p-2 border rounded" />
                    ) : (
                        <>
                            <div className="mb-2">
                                <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded inline-flex items-center gap-2 transition text-sm font-bold">
                                    <span>📷 Wgraj Zdjęcie / Wykres</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <span className="text-xs text-gray-500 ml-2">Obrazek zostanie dopisany do treści.</span>
                            </div>
                            <textarea placeholder="Treść Markdown..." value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={6} className="w-full p-2 border rounded font-mono" />
                        </>
                    )}
                    
                    <input type="text" placeholder="Opis" value={lessonDesc} onChange={e => setLessonDesc(e.target.value)} className="w-full p-2 border rounded" />
                    <button type="submit" className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-bold self-start">+ Dodaj Lekcję</button>
                </form>
            </div>
        )}
      </div>

      <div className="w-full md:w-1/4 border-l border-gray-200 bg-gray-50 overflow-y-auto h-full">
        <div className="p-5 border-b border-gray-200 font-bold bg-white sticky top-0 z-10">Program Kursu</div>
        <ul className="divide-y divide-gray-100">
          {course.lessons.map((lesson) => (
            <li key={lesson.id} onClick={() => { if(hasAccess) { setActiveLesson(lesson); setIsEditingLesson(false); } }} 
              className={`p-4 cursor-pointer transition flex items-start gap-3 ${!hasAccess ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white'} ${activeLesson?.id === lesson.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : ''}`}>
              <div className="mt-1">{lesson.type === 'VIDEO' ? '🎥' : '📄'}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-400 uppercase">Lekcja {lesson.position}</div>
                <div className={`font-medium ${activeLesson?.id === lesson.id ? 'text-indigo-900' : 'text-gray-700'}`}>{lesson.title}</div>
              </div>
              {!hasAccess && <span>🔒</span>}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default CoursePage;