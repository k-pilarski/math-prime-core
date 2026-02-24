import { useState, useEffect } from 'react';
import axios from 'axios';

interface Props {
  lessonId: string;
}

const PrivateNote = ({ lessonId }: Props) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const res = await axios.get(`http://localhost:3000/api/notes/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNote(res.data.text || '');
        setSaveMessage('');
      } catch (error) {
        console.error('Błąd pobierania notatki', error);
      }
    };
    fetchNote();
  }, [lessonId]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsSaving(true);
    setSaveMessage('Zapisywanie...');
    
    try {
      await axios.post(`http://localhost:3000/api/notes`, 
        { lessonId, text: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveMessage('✅ Zapisano pomyślnie!');
      
      setTimeout(() => setSaveMessage(''), 3000); 
    } catch (error) {
      setSaveMessage('❌ Błąd zapisu!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
          📝 Moje Prywatne Notatki
        </h3>
        <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
          Tylko Ty je widzisz
        </span>
      </div>
      
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Zapisz tutaj swoje wnioski, ważne wzory lub pytania do tej lekcji..."
        className="w-full h-40 p-4 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white text-gray-700 resize-y"
      />
      
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition disabled:opacity-50 shadow-sm"
        >
          Zapisz notatkę
        </button>
        {saveMessage && (
            <span className="text-sm font-bold text-gray-600 animate-pulse">
                {saveMessage}
            </span>
        )}
      </div>
    </div>
  );
};

export default PrivateNote;