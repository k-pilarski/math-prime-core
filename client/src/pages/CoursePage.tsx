import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  position: number;
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
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonPos, setNewLessonPos] = useState(1);

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
      .catch(error => console.error("Błąd kursu:", error));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    fetchCourseData();

    if (token) {
      axios.get(`http://localhost:3000/api/purchases/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setHasAccess(res.data.hasAccess))
      .catch(() => setHasAccess(false))
      .finally(() => setLoading(false));

      axios.get(`http://localhost:3000/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.user.role === 'ADMIN') {
          setIsAdmin(true);
          setHasAccess(true);
        }
      })
      .catch(err => console.log("Nie jesteś adminem", err));
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
      alert(error.response?.data?.error || "Błąd");
      setIsPurchasing(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    let formattedUrl = newLessonUrl;
    if (formattedUrl.includes("watch?v=")) {
        formattedUrl = formattedUrl.replace("watch?v=", "embed/");
    } else if (formattedUrl.includes("youtu.be/")) {
        const parts = formattedUrl.split("youtu.be/");
        formattedUrl = `https://www.youtube.com/embed/${parts[1]}`;
    }

    try {
        await axios.post(`http://localhost:3000/api/courses/${id}/lessons`, {
            title: newLessonTitle,
            description: newLessonDesc,
            videoUrl: formattedUrl,
            position: Number(newLessonPos)
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("Lekcja dodana!");
        setNewLessonTitle('');
        setNewLessonUrl('');
        setNewLessonDesc('');
        fetchCourseData();
    } catch (err) {
        alert("Błąd dodawania lekcji");
        console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Ładowanie...</div>;
  if (!course) return <div style={{ padding: '20px' }}>Nie znaleziono kursu.</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', fontFamily: 'Arial' }}>
      
      <div style={{ flex: 3, padding: '20px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '24px' }}>{course.title}</h1>
        <p style={{ color: '#666' }}>{course.description}</p>
        <hr style={{ margin: '20px 0', borderTop: '1px solid #eee' }} />

        {hasAccess ? (
          activeLesson ? (
            <div>
              <h3>Lekcja {activeLesson.position}: {activeLesson.title}</h3>
              {activeLesson.videoUrl && (
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe width="100%" height="100%" src={activeLesson.videoUrl} title="Video" allowFullScreen frameBorder="0"></iframe>
                </div>
              )}
              <p style={{ marginTop: '20px' }}>{activeLesson.description}</p>
            </div>
          ) : (
            <p>Ten kurs nie ma lekcji.</p>
          )
        ) : (
          <div style={{ padding: '50px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: '#856404' }}>🔒 Treść zablokowana</h2>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '20px 0' }}>Cena: {course.price} PLN</div>
            <button onClick={handleBuy} disabled={isPurchasing} style={{ padding: '15px 30px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {isPurchasing ? "Przetwarzanie..." : "KUP TERAZ"}
            </button>
          </div>
        )}

        {isAdmin && (
            <div style={{ marginTop: '50px', padding: '20px', border: '2px dashed red', background: '#fff5f5' }}>
                <h3 style={{ color: 'red', marginTop: 0 }}>🔧 Panel Administratora: Dodaj Lekcję</h3>
                <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" placeholder="Tytuł lekcji" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} required style={{ padding: '8px' }} />
                    <input type="text" placeholder="Link do YouTube (np. https://www.youtube.com/watch?v=...)" value={newLessonUrl} onChange={e => setNewLessonUrl(e.target.value)} style={{ padding: '8px' }} />
                    <input type="text" placeholder="Krótki opis" value={newLessonDesc} onChange={e => setNewLessonDesc(e.target.value)} style={{ padding: '8px' }} />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label>Numer lekcji:</label>
                        <input type="number" value={newLessonPos} onChange={e => setNewLessonPos(Number(e.target.value))} style={{ padding: '8px', width: '60px' }} />
                    </div>
                    <button type="submit" style={{ background: 'red', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}>+ Dodaj Lekcję</button>
                </form>
            </div>
        )}
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid #ddd', background: '#f9f9f9', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', fontWeight: 'bold', background: '#fff' }}>Program Kursu</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {course.lessons.map((lesson) => (
            <li key={lesson.id} onClick={() => hasAccess && setActiveLesson(lesson)} style={{ padding: '15px 20px', borderBottom: '1px solid #eee', cursor: hasAccess ? 'pointer' : 'not-allowed', opacity: hasAccess ? 1 : 0.5, background: activeLesson?.id === lesson.id ? '#e6f7ff' : 'transparent', fontWeight: activeLesson?.id === lesson.id ? 'bold' : 'normal' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>Lekcja {lesson.position}</div>
              {lesson.title}
              {!hasAccess && <span style={{ fontSize: '10px', marginLeft: '5px' }}>🔒</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CoursePage;