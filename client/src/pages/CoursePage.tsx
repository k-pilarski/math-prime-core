import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import CommentSection from '../components/CommentSection';

const RenderMath = ({ children }: { children: string }) => (
  <span className="prose prose-sm max-w-none inline-block text-gray-800">
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({node, ...props}) => <span {...props} />
      }}
    >
      {children}
    </ReactMarkdown>
  </span>
);

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface Material {
  id: string;
  title: string;
  url: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  position: number;
  type: 'VIDEO' | 'TEXT' | 'QUIZ';
  videoUrl?: string;
  content?: string;
  materials?: Material[];
  questions?: QuizQuestion[];
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
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

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
  const [lessonType, setLessonType] = useState<'VIDEO' | 'TEXT' | 'QUIZ'>('VIDEO');
  const [lessonUrl, setLessonUrl] = useState('');      
  const [lessonContent, setLessonContent] = useState(''); 
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
  ]);

  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({}); 
  const [quizResult, setQuizResult] = useState<{score: number, passed: boolean} | null>(null);

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
        if (!isEditingLesson) setLessonPos(lessons.length + 1);
      })
      .catch(error => console.error("Błąd pobierania kursu:", error));
  };

  const fetchProgress = () => {
      const token = localStorage.getItem('token');
      if (token && id) {
          axios.get(`http://localhost:3000/api/progress/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => setCompletedLessonIds(res.data)).catch(err => console.error(err));
      }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchCourseData();
    if (token) {
      fetchProgress();
      axios.get(`http://localhost:3000/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.user.role === 'ADMIN') { setIsAdmin(true); setHasAccess(true); } 
        else { axios.get(`http://localhost:3000/api/purchases/check/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(accessRes => setHasAccess(accessRes.data.hasAccess)); }
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      axios.get(`http://localhost:3000/api/purchases/check/${id}`).then(res => setHasAccess(res.data.hasAccess)).catch(() => setHasAccess(false)).finally(() => setLoading(false));
    }
  }, [id]);

  const handleQuizOptionChange = (questionId: string, optionId: string) => setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));

  const checkQuiz = async () => {
      if (!activeLesson?.questions) return;
      let correctCount = 0;
      let total = activeLesson.questions.length;
      activeLesson.questions.forEach(q => {
          const selectedOptionId = userAnswers[q.id];
          const correctOption = q.options.find(o => o.isCorrect);
          if (selectedOptionId === correctOption?.id) correctCount++;
      });
      const passed = correctCount === total;
      setQuizResult({ score: correctCount, passed });
      if (passed) {
          if (!completedLessonIds.includes(activeLesson.id)) await toggleLessonCompletion(activeLesson.id, true);
          alert("Gratulacje! Quiz zaliczony! ✅");
      } else {
          alert(`Wynik: ${correctCount}/${total}. Spróbuj jeszcze raz!`);
      }
  };

  const handleAddQuestion = async () => {
      if (!newQText || !activeLesson) return;
      const token = localStorage.getItem('token');
      try {
          await axios.post(`http://localhost:3000/api/courses/lessons/${activeLesson.id}/quiz`, { text: newQText, options: newQOptions }, { headers: { Authorization: `Bearer ${token}` } });
          setNewQText('');
          setNewQOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]);
          fetchCourseData(true);
          alert("Pytanie dodane!");
      } catch (err) { alert("Błąd dodawania pytania"); }
  };

  const handleDeleteQuestion = async (qId: string) => {
      if (!confirm("Usunąć pytanie?")) return;
      const token = localStorage.getItem('token');
      try { await axios.delete(`http://localhost:3000/api/courses/quiz/question/${qId}`, { headers: { Authorization: `Bearer ${token}` } }); fetchCourseData(true); } catch (err) { alert("Błąd usuwania"); }
  };

  const toggleLessonCompletion = async (lessonId: string, forceAdd = false) => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const isCompleted = completedLessonIds.includes(lessonId);
      if (forceAdd && isCompleted) return;
      try {
          if (isCompleted && !forceAdd) {
              setCompletedLessonIds(prev => prev.filter(id => id !== lessonId));
              await axios.delete(`http://localhost:3000/api/progress/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
          } else {
              setCompletedLessonIds(prev => [...prev, lessonId]);
              await axios.post(`http://localhost:3000/api/progress/${lessonId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
          }
      } catch (err) { console.error("Błąd postępu", err); fetchProgress(); }
  };

  const handleBuy = async () => {
    const token = localStorage.getItem('token');
    if (!token) { alert("Musisz być zalogowany!"); navigate('/login'); return; }
    if (!confirm(`Kupić kurs za ${course?.price} PLN?`)) return;
    try { setIsPurchasing(true); await axios.post('http://localhost:3000/api/purchases', { courseId: id }, { headers: { Authorization: `Bearer ${token}` } }); alert("Zakup udany!"); setHasAccess(true); setIsPurchasing(false); } catch (error: any) { alert(error.response?.data?.error || "Błąd zakupu"); setIsPurchasing(false); }
  };

  const handleUpdateCourse = async () => {
    try { const token = localStorage.getItem('token'); await axios.put(`http://localhost:3000/api/courses/${id}`, { title: editCourseTitle, description: editCourseDesc, price: editCoursePrice }, { headers: { Authorization: `Bearer ${token}` } }); setIsEditingCourse(false); fetchCourseData(true); alert("Kurs zaktualizowany!"); } catch (err) { alert("Błąd aktualizacji"); }
  };

  const startEditingLesson = (lesson: Lesson) => {
      setLessonTitle(lesson.title); setLessonDesc(lesson.description); setLessonPos(lesson.position); setLessonType(lesson.type); setLessonUrl(lesson.videoUrl || ''); setLessonContent(lesson.content || ''); setIsEditingLesson(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (lessonId: string) => { if(!confirm("Usunąć lekcję?")) return; try { const token = localStorage.getItem('token'); await axios.delete(`http://localhost:3000/api/courses/${id}/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }); setActiveLesson(null); fetchCourseData(); } catch (err) { alert("Błąd usuwania"); } };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const formData = new FormData(); formData.append('file', file); try { const token = localStorage.getItem('token'); const res = await axios.post('http://localhost:3000/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }); const markdownImage = `\n![Opis zdjęcia](${res.data.url})\n`; setLessonContent(prev => prev + markdownImage); } catch (err) { alert("Błąd wgrywania"); } };

  const handleAddMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !activeLesson) return; const title = prompt("Podaj nazwę pliku:", file.name); if(!title) return; setUploadingMaterial(true); const formData = new FormData(); formData.append('file', file); try { const token = localStorage.getItem('token'); const uploadRes = await axios.post('http://localhost:3000/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }); await axios.post(`http://localhost:3000/api/courses/lessons/${activeLesson.id}/materials`, { title: title, url: uploadRes.data.url }, { headers: { Authorization: `Bearer ${token}` } }); alert("Materiał dodany!"); fetchCourseData(true); } catch (err) { alert("Błąd dodawania materiału"); } finally { setUploadingMaterial(false); } };

  const handleDeleteMaterial = async (materialId: string) => { if(!confirm("Usunąć materiał?")) return; try { const token = localStorage.getItem('token'); await axios.delete(`http://localhost:3000/api/courses/materials/${materialId}`, { headers: { Authorization: `Bearer ${token}` } }); fetchCourseData(true); } catch(err) { alert("Błąd usuwania materiału"); } };

  const handleSaveLesson = async (e: React.FormEvent) => { e.preventDefault(); const token = localStorage.getItem('token'); let finalVideoUrl = undefined; let finalContent = undefined; if (lessonType === 'VIDEO') { const embedUrl = getYouTubeEmbedUrl(lessonUrl); if (lessonUrl && !embedUrl) { alert("Zły link YouTube!"); return; } finalVideoUrl = embedUrl || lessonUrl; } else if (lessonType === 'TEXT') { finalContent = lessonContent; } try { if (isEditingLesson && activeLesson) { await axios.put(`http://localhost:3000/api/courses/${id}/lessons/${activeLesson.id}`, { title: lessonTitle, description: lessonDesc, position: Number(lessonPos), type: lessonType, videoUrl: finalVideoUrl, content: finalContent }, { headers: { Authorization: `Bearer ${token}` } }); setIsEditingLesson(false); } else { await axios.post(`http://localhost:3000/api/courses/${id}/lessons`, { title: lessonTitle, description: lessonDesc, position: Number(lessonPos), type: lessonType, videoUrl: finalVideoUrl, content: finalContent }, { headers: { Authorization: `Bearer ${token}` } }); alert("Lekcja dodana!"); } setLessonTitle(''); setLessonUrl(''); setLessonContent(''); setLessonDesc(''); if (course?.lessons) setLessonPos(course.lessons.length + 2); fetchCourseData(true); } catch (err) { alert("Błąd zapisu lekcji"); } };

  const cancelEditLesson = () => { setIsEditingLesson(false); setLessonTitle(''); setLessonUrl(''); setLessonContent(''); setLessonDesc(''); if (course?.lessons) setLessonPos(course.lessons.length + 1); };

  const totalLessons = course?.lessons?.length || 0;
  const completedCount = completedLessonIds.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) return <div className="p-10 text-center">Ładowanie...</div>;
  if (!course) return <div className="p-10 text-center text-red-500">Brak kursu.</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] font-sans bg-white">
      <div className="flex-3 p-6 w-full md:w-3/4">
        {!isEditingCourse ? (
            <div className="mb-6 border-b border-gray-200 pb-6">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                    {isAdmin && <button onClick={() => { setIsEditingCourse(true); setEditCourseTitle(course.title); setEditCourseDesc(course.description); setEditCoursePrice(course.price); }} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200">✏️ Edytuj Info</button>}
                </div>
                <p className="text-gray-600 mt-2">{course.description}</p>
            </div>
        ) : (
            <div className="mb-6 bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                <input type="text" value={editCourseTitle} onChange={e => setEditCourseTitle(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Tytuł" />
                <textarea value={editCourseDesc} onChange={e => setEditCourseDesc(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Opis" rows={3} />
                <div className="flex items-center gap-2 mb-2"><span>Cena:</span><input type="number" value={editCoursePrice} onChange={e => setEditCoursePrice(Number(e.target.value))} className="p-2 border rounded w-32" /></div>
                <div className="flex gap-2"><button onClick={handleUpdateCourse} className="bg-green-600 text-white px-4 py-2 rounded">Zapisz</button><button onClick={() => setIsEditingCourse(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Anuluj</button></div>
            </div>
        )}

        {isEditingLesson ? (
             <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200 mb-8">
                <h3 className="text-orange-900 font-bold text-xl mb-4">✏️ Edytujesz lekcję: {activeLesson?.title}</h3>
                <form onSubmit={handleSaveLesson} className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" checked={lessonType === 'VIDEO'} onChange={() => setLessonType('VIDEO')} /> 🎥 Wideo</label>
                        <label className="flex items-center gap-2"><input type="radio" checked={lessonType === 'TEXT'} onChange={() => setLessonType('TEXT')} /> 📄 Tekst</label>
                        <label className="flex items-center gap-2"><input type="radio" checked={lessonType === 'QUIZ'} onChange={() => setLessonType('QUIZ')} /> ❓ Quiz</label>
                     </div>
                     <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className="p-2 border rounded" placeholder="Tytuł" required />
                     {lessonType === 'VIDEO' && ( <input type="text" value={lessonUrl} onChange={e => setLessonUrl(e.target.value)} className="p-2 border rounded" placeholder="Link YouTube" /> )}
                     {lessonType === 'TEXT' && ( 
                         <>
                            <div className="mb-2"><label className="cursor-pointer bg-orange-200 hover:bg-orange-300 px-4 py-2 rounded inline-flex items-center gap-2 text-sm font-bold"><span>📷 Wgraj Zdjęcie</span><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div>
                            <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={10} className="p-2 border rounded font-mono" placeholder="Treść Markdown..." />
                         </>
                     )}
                     {lessonType === 'QUIZ' && activeLesson && (
                         <div className="bg-white p-4 rounded border border-orange-200">
                             <h4 className="font-bold text-lg mb-2">Zarządzanie pytaniami</h4>
                             <p className="text-sm text-gray-500 mb-2">Możesz używać LaTeX: <code>$E=mc^2$</code></p>
                             <ul className="mb-4 space-y-2">
                                 {activeLesson.questions?.map((q, idx) => (
                                     <li key={q.id} className="border-b pb-2">
                                         <div className="flex justify-between items-start">
                                             <div className="font-bold flex gap-1"><span>{idx+1}.</span> <RenderMath>{q.text}</RenderMath></div>
                                             <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 font-bold">Usuń</button>
                                         </div>
                                         <div className="text-sm text-gray-500 ml-4 flex gap-1">
                                             Poprawna: <RenderMath>{q.options.find(o => o.isCorrect)?.text || ''}</RenderMath>
                                         </div>
                                     </li>
                                 ))}
                             </ul>
                             <div className="border-t pt-2">
                                 <p className="font-bold text-sm mb-2">Dodaj nowe pytanie:</p>
                                 <input type="text" value={newQText} onChange={e => setNewQText(e.target.value)} placeholder="Treść pytania (Markdown/LaTeX)..." className="w-full p-2 border rounded mb-2" />
                                 <div className="grid grid-cols-2 gap-2 mb-2">
                                     {newQOptions.map((opt, i) => (
                                         <div key={i} className="flex items-center gap-1">
                                             <input type="radio" name="correctOpt" checked={opt.isCorrect} onChange={() => { const newOpts = newQOptions.map((o, idx) => ({ ...o, isCorrect: idx === i })); setNewQOptions(newOpts); }} />
                                             <input type="text" value={opt.text} onChange={e => { const newOpts = [...newQOptions]; newOpts[i].text = e.target.value; setNewQOptions(newOpts); }} placeholder={`Odp ${i+1}`} className={`w-full p-1 border rounded ${opt.isCorrect ? 'border-green-500 bg-green-50' : ''}`} />
                                         </div>
                                     ))}
                                 </div>
                                 <button type="button" onClick={handleAddQuestion} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Dodaj Pytanie</button>
                             </div>
                         </div>
                     )}
                     {activeLesson && (
                         <div className="mt-4 border-t border-orange-200 pt-4">
                             <h4 className="font-bold text-orange-800 mb-2">📎 Materiały</h4>
                             <ul className="mb-4 space-y-2">
                                 {activeLesson.materials?.map(mat => ( <li key={mat.id} className="flex justify-between items-center bg-white p-2 rounded border border-orange-100"><a href={mat.url} target="_blank" className="text-indigo-600 hover:underline text-sm truncate">{mat.title}</a><button type="button" onClick={() => handleDeleteMaterial(mat.id)} className="text-red-500 font-bold px-2">X</button></li> ))}
                             </ul>
                             <label className="cursor-pointer bg-orange-200 hover:bg-orange-300 text-orange-900 px-4 py-2 rounded inline-flex items-center gap-2 text-sm font-bold"><span>{uploadingMaterial ? "Wgrywanie..." : "➕ Dodaj plik"}</span><input type="file" className="hidden" disabled={uploadingMaterial} onChange={handleAddMaterial} /></label>
                         </div>
                     )}
                     <div className="flex gap-2 mt-4"><button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-bold">Zapisz Zmiany</button><button type="button" onClick={cancelEditLesson} className="bg-gray-400 text-white px-6 py-2 rounded">Anuluj</button></div>
                </form>
             </div>
        ) : (
            hasAccess ? (
            activeLesson ? (
                <div>
                <div className="flex justify-between items-center mb-4">
                    <div><span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">Lekcja {activeLesson.position}</span><h2 className="text-2xl font-bold text-gray-800 mt-1">{activeLesson.title}</h2></div>
                    {isAdmin && ( <div className="flex gap-2"><button onClick={() => startEditingLesson(activeLesson)} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 text-sm font-bold">✏️ Edytuj</button><button onClick={() => handleDeleteLesson(activeLesson.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm font-bold">🗑️ Usuń</button></div> )}
                </div>
                {activeLesson.type === 'VIDEO' && ( activeLesson.videoUrl ? ( <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-xl"><iframe width="100%" height="100%" src={activeLesson.videoUrl} title="Video" allowFullScreen frameBorder="0"></iframe></div> ) : <div className="p-10 bg-gray-100 rounded text-center">Brak wideo.</div> )}
                {activeLesson.type === 'TEXT' && ( <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"><article className="prose lg:prose-xl max-w-none text-gray-800"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{activeLesson.content || "Brak treści."}</ReactMarkdown></article></div> )}
                {activeLesson.type === 'QUIZ' && (
                    <div className="bg-indigo-50 p-8 rounded-xl border border-indigo-200">
                        <h3 className="text-xl font-bold text-indigo-900 mb-6">🧠 Sprawdź swoją wiedzę</h3>
                        {!activeLesson.questions || activeLesson.questions.length === 0 ? ( <p className="text-gray-500">Brak pytań w tym quizie.</p> ) : (
                            <div className="space-y-6">
                                {activeLesson.questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white p-4 rounded shadow-sm">
                                        <div className="font-bold text-lg mb-3 flex gap-1"><span>{idx + 1}.</span> <RenderMath>{q.text}</RenderMath></div>
                                        <div className="space-y-2">
                                            {q.options.map(opt => (
                                                <label key={opt.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer border hover:bg-gray-50 ${quizResult && opt.isCorrect ? 'bg-green-100 border-green-400' : ''} ${quizResult && !opt.isCorrect && userAnswers[q.id] === opt.id ? 'bg-red-100 border-red-400' : ''}`}>
                                                    <input type="radio" name={`q-${q.id}`} checked={userAnswers[q.id] === opt.id} onChange={() => !quizResult && handleQuizOptionChange(q.id, opt.id)} disabled={!!quizResult} />
                                                    <RenderMath>{opt.text}</RenderMath>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {!quizResult ? ( <button onClick={checkQuiz} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 shadow-lg w-full">Sprawdź Odpowiedzi</button> ) : ( <div className={`p-4 rounded-lg text-center font-bold text-xl ${quizResult.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{quizResult.passed ? "✅ Brawo! Quiz zaliczony!" : `❌ Wynik: ${quizResult.score}/${activeLesson.questions.length}. Spróbuj ponownie.`}{!quizResult.passed && <button onClick={() => { setQuizResult(null); setUserAnswers({}); }} className="block mx-auto mt-2 text-sm underline font-normal">Restart</button>}</div> )}
                            </div>
                        )}
                    </div>
                )}
                {activeLesson.materials && activeLesson.materials.length > 0 && ( <div className="mt-6"><h3 className="font-bold text-gray-700 mb-3">📎 Materiały do pobrania:</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{activeLesson.materials.map(mat => ( <a key={mat.id} href={mat.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"><span className="text-2xl">📄</span><span className="text-indigo-700 font-medium group-hover:underline">{mat.title}</span></a> ))}</div></div> )}
                <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-gray-600 flex-1">{activeLesson.description}</p>
                    {activeLesson.type !== 'QUIZ' && ( <button onClick={() => toggleLessonCompletion(activeLesson.id)} className={`ml-4 flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition shadow-sm ${completedLessonIds.includes(activeLesson.id) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-gray-300 text-gray-600'}`}>{completedLessonIds.includes(activeLesson.id) ? <>✅ Ukończono</> : <>⭕ Oznacz jako ukończone</>}</button> )}
                    {activeLesson.type === 'QUIZ' && completedLessonIds.includes(activeLesson.id) && ( <span className="ml-4 px-6 py-3 rounded-lg font-bold bg-green-100 text-green-700 border border-green-200">✅ Zaliczono</span> )}
                </div>
                
                <CommentSection lessonId={activeLesson.id} />

                </div>
            ) : ( <p className="text-gray-500 italic">Brak lekcji.</p> )
            ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-yellow-50 border-2 border-yellow-200 border-dashed rounded-xl text-center"><div className="text-5xl mb-4">🔒</div><h2 className="text-2xl text-yellow-800 font-bold mb-2">Treść zablokowana</h2><div className="text-4xl font-extrabold text-gray-900 mb-6">{course.price === 0 ? "ZA DARMO" : `${course.price} PLN`}</div><button onClick={handleBuy} disabled={isPurchasing} className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-700 shadow-lg">{isPurchasing ? "..." : (course.price === 0 ? "DOŁĄCZ" : "KUP TERAZ")}</button></div>
            )
        )}
        {isAdmin && !isEditingLesson && (
            <div className="mt-16 p-8 border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-xl">
                <h3 className="text-indigo-900 font-bold text-xl mb-6">➕ Dodaj Nową Lekcję</h3>
                <form onSubmit={handleSaveLesson} className="flex flex-col gap-5">
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100"><input type="radio" name="ntype" checked={lessonType === 'VIDEO'} onChange={() => setLessonType('VIDEO')} className="text-indigo-600"/> 🎥 Wideo</label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100"><input type="radio" name="ntype" checked={lessonType === 'TEXT'} onChange={() => setLessonType('TEXT')} className="text-indigo-600"/> 📄 Tekst</label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-indigo-100"><input type="radio" name="ntype" checked={lessonType === 'QUIZ'} onChange={() => setLessonType('QUIZ')} className="text-indigo-600"/> ❓ Quiz</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="md:col-span-3"> <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required className="w-full p-2 border rounded" placeholder="Tytuł lekcji" /> </div><div> <input type="number" value={lessonPos} onChange={e => setLessonPos(Number(e.target.value))} className="w-full p-2 border rounded" placeholder="Nr" /> </div></div>
                    {lessonType === 'VIDEO' && ( <input type="text" placeholder="Link YouTube" value={lessonUrl} onChange={e => setLessonUrl(e.target.value)} className="w-full p-2 border rounded" /> )}
                    {lessonType === 'TEXT' && ( <textarea placeholder="Treść Markdown..." value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={6} className="w-full p-2 border rounded font-mono" /> )}
                    {lessonType === 'QUIZ' && <p className="text-sm text-gray-500 italic border p-2 rounded bg-gray-50">Pytania będziesz mógł dodać po utworzeniu lekcji.</p>}
                    <input type="text" placeholder="Opis" value={lessonDesc} onChange={e => setLessonDesc(e.target.value)} className="w-full p-2 border rounded" />
                    <button type="submit" className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-bold self-start">+ Dodaj Lekcję</button>
                </form>
            </div>
        )}
      </div>
      <div className="w-full md:w-1/4 border-l border-gray-200 bg-gray-50 overflow-y-auto h-full flex flex-col">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-10"><div className="flex justify-between items-center mb-2"><span className="font-bold text-gray-800"> Postęp</span><span className="text-sm font-bold text-indigo-600">{progressPercentage}%</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div></div></div>
        <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto">
          {course.lessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            return ( <li key={lesson.id} onClick={() => { if(hasAccess) { setActiveLesson(lesson); setIsEditingLesson(false); setQuizResult(null); setUserAnswers({}); } }} className={`p-4 cursor-pointer transition flex items-start gap-3 relative ${!hasAccess ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white'} ${activeLesson?.id === lesson.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : ''} ${isCompleted ? 'bg-green-50/50' : ''}`}><div className="mt-1 text-lg">{isCompleted ? '✅' : (lesson.type === 'VIDEO' ? '🎥' : (lesson.type === 'QUIZ' ? '❓' : '📄'))}</div><div className="flex-1"><div className="text-xs font-semibold text-gray-400 uppercase">Lekcja {lesson.position}</div><div className={`font-medium ${activeLesson?.id === lesson.id ? 'text-indigo-900' : (isCompleted ? 'text-gray-500 line-through decoration-green-500' : 'text-gray-700')}`}>{lesson.title}</div></div>{!hasAccess && <span>🔒</span>}</li> );
          })}
        </ul>
      </div>
    </div>
  );
}

export default CoursePage;