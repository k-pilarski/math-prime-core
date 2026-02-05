import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.get('http://localhost:3000/api/purchases/my-courses', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setCourses(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error(error);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div style={{ padding: '20px' }}>Ładowanie Twoich kursów...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>Moje Kursy</h1>
      
      {courses.length === 0 ? (
        <p>Nie masz jeszcze żadnych kursów. <Link to="/">Przejrzyj ofertę.</Link></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {courses.map(course => (
            <div key={course.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{course.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', height: '40px', overflow: 'hidden' }}>
                  {course.description}
                </p>
                <Link 
                  to={`/course/${course.id}`} 
                  style={{ display: 'block', textAlign: 'center', marginTop: '15px', padding: '10px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}
                >
                  Przejdź do nauki
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCoursesPage;