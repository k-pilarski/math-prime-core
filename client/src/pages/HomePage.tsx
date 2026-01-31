import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/courses')
      .then(response => {
        setCourses(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Błąd pobierania kursów:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>Witaj w MathPrime</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Wybierz kurs i zacznij naukę już dziś.</p>
      </div>

      {loading ? (
        <p>Ładowanie kursów...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          
          {courses.map(course => (
            <div key={course.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: '0' }}>{course.title}</h2>
              <p style={{ color: '#555', height: '60px', overflow: 'hidden' }}>
                {course.description || "Brak opisu"}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'green' }}>
                  {course.price > 0 ? `${course.price} PLN` : "Darmowy"}
                </span>
                <Link to={`/course/${course.id}`} style={{ padding: '8px 16px', background: 'blue', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                  Zobacz więcej
                </Link>
              </div>
            </div>
          ))}

          {courses.length === 0 && <p>Nie ma jeszcze żadnych kursów.</p>}
        </div>
      )}
    </div>
  );
}

export default HomePage;