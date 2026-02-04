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

  useEffect(() => {
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:3000/api/courses/${id}`)
      .then(response => {
        setCourse(response.data);
        if (response.data.lessons && response.data.lessons.length > 0) {
          setActiveLesson(response.data.lessons[0]);
        }
      })
      .catch(error => console.error("Błąd kursu:", error));

    if (token) {
      axios.get(`http://localhost:3000/api/purchases/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setHasAccess(res.data.hasAccess);
      })
      .catch(err => console.error("Błąd sprawdzania dostępu:", err))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

  }, [id]);

  const handleBuy = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Musisz być zalogowany, aby kupić kurs!");
      navigate('/login');
      return;
    }

    if (!confirm(`Czy na pewno chcesz kupić ten kurs?`)) return;

    try {
      setIsPurchasing(true);
      await axios.post('http://localhost:3000/api/purchases', 
        { courseId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Zakup udany! Dziękujemy.");
      setHasAccess(true);
      setIsPurchasing(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Błąd zakupu");
      setIsPurchasing(false);
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
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={activeLesson.videoUrl} 
                    title="Video player" 
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                </div>
              )}
              <p style={{ marginTop: '20px' }}>{activeLesson.description}</p>
            </div>
          ) : (
            <p>Ten kurs nie ma lekcji.</p>
          )
        ) : (

          <div style={{ 
            padding: '50px', 
            background: '#fff3cd', 
            border: '1px solid #ffeeba', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h2 style={{ color: '#856404' }}>🔒 Treść zablokowana</h2>
            <p>Aby oglądać lekcje z tego kursu, musisz go najpierw wykupić.</p>
            
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '20px 0' }}>
              Cena: {course.price} PLN
            </div>

            <button 
              onClick={handleBuy}
              disabled={isPurchasing}
              style={{ 
                padding: '15px 30px', 
                fontSize: '18px', 
                background: isPurchasing ? '#ccc' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: isPurchasing ? 'not-allowed' : 'pointer'
              }}
            >
              {isPurchasing ? "Przetwarzanie..." : "KUP TERAZ"}
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid #ddd', background: '#f9f9f9', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
          Program Kursu
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {course.lessons.map((lesson) => (
            <li 
              key={lesson.id}
              onClick={() => hasAccess && setActiveLesson(lesson)}
              style={{ 
                padding: '15px 20px', 
                borderBottom: '1px solid #eee', 
                cursor: hasAccess ? 'pointer' : 'not-allowed',
                opacity: hasAccess ? 1 : 0.5,
                background: activeLesson?.id === lesson.id ? '#e6f7ff' : 'transparent',
                fontWeight: activeLesson?.id === lesson.id ? 'bold' : 'normal'
              }}
            >
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