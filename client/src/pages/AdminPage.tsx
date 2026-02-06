import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://localhost:3000/api/courses', {
        title,
        description,
        price: Number(price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Kurs został utworzony!");
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setError("Brak uprawnień administratora!");
      } else {
        setError("Błąd podczas tworzenia kursu.");
      }
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1>Panel Administratora</h1>
      <h3>Dodaj nowy kurs</h3>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Tytuł kursu:</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Opis:</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={4}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Cena (PLN):</label>
          <input 
            type="number" 
            value={price} 
            onChange={e => setPrice(Number(e.target.value))} 
            min="0"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ padding: '10px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}
        >
          Stwórz Kurs
        </button>
      </form>
    </div>
  );
}

export default AdminPage;