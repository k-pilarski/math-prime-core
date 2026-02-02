import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/courses/${id}`)
      .then(response => {
        setCourse(response.data);
        
        if (response.data.lessons && response.data.lessons.length > 0) {
          setActiveLesson(response.data.lessons[0]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Błąd:", error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ padding: '20px' }}>Ładowanie kursu...</div>;
  if (!course) return <div style={{ padding: '20px' }}>Nie znaleziono kursu.</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', fontFamily: 'Arial' }}>
      
      <div style={{ flex: 3, padding: '20px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{course.title}</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>{course.description}</p>
        
        <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '20px' }} />

        {activeLesson ? (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Lekcja {activeLesson.position}: {activeLesson.title}</h3>
            
            {activeLesson.videoUrl && (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={activeLesson.videoUrl} 
                  title="Video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            )}
            
            <p style={{ marginTop: '20px', lineHeight: '1.6' }}>{activeLesson.description}</p>
          </div>
        ) : (
          <div style={{ padding: '40px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            Ten kurs nie ma jeszcze dodanych lekcji.
          </div>
        )}
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid #ddd', background: '#f9f9f9', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', fontWeight: 'bold', background: '#fff' }}>
          Program Kursu
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {course.lessons.map((lesson) => (
            <li 
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              style={{ 
                padding: '15px 20px', 
                borderBottom: '1px solid #eee', 
                cursor: 'pointer',
                background: activeLesson?.id === lesson.id ? '#e6f7ff' : 'transparent',
                borderLeft: activeLesson?.id === lesson.id ? '4px solid #1890ff' : '4px solid transparent',
                fontWeight: activeLesson?.id === lesson.id ? 'bold' : 'normal'
              }}
            >
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Lekcja {lesson.position}</div>
              {lesson.title}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default CoursePage;