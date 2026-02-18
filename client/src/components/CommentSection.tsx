import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: User;
}

interface Props {
  lessonId: string;
}

const CommentSection = ({ lessonId }: Props) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchComments();
    const token = localStorage.getItem('token');
    if (token) {
        axios.get('http://localhost:3000/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setCurrentUser(res.data.user)).catch(() => {});
    }
  }, [lessonId]);

  const fetchComments = async () => {
    try {
        const res = await axios.get(`http://localhost:3000/api/comments/lesson/${lessonId}`);
        setComments(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      const token = localStorage.getItem('token');
      if (!token) return alert("Zaloguj się, aby komentować.");

      try {
          await axios.post('http://localhost:3000/api/comments', 
            { text: newComment, lessonId }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setNewComment('');
          fetchComments();
      } catch (err) { alert("Błąd dodawania komentarza"); }
  };

  const handleDelete = async (commentId: string) => {
      if (!confirm("Usunąć ten komentarz?")) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`http://localhost:3000/api/comments/${commentId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          fetchComments();
      } catch (err) { alert("Nie możesz usunąć tego komentarza."); }
  };

  const getInitials = (user?: User) => {
      if (!user?.email) return '??';
      if (user.role === 'ADMIN') return 'AD';
      return 'AN';
  };

  const getDisplayName = (commentUser?: User) => {
      if (!commentUser) return 'Użytkownik usunięty';
      if (commentUser.role === 'ADMIN') return 'Administrator';
      if (currentUser && currentUser.id === commentUser.id) return 'Ty';
      return 'Anonim';
  };

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pl-PL', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
  };

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">💬 Dyskusja ({comments.length})</h3>

      <form onSubmit={handleAddComment} className="mb-8 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
              {currentUser ? getInitials(currentUser) : '?'}
          </div>
          <div className="flex-1">
              <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Zadaj pytanie lub podziel się opinią..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px]"
              />
              <button type="submit" className="mt-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
                  Opublikuj
              </button>
          </div>
      </form>

      <div className="space-y-6">
          {loading ? <p>Ładowanie komentarzy...</p> : comments.map(comment => (
              <div key={comment.id} className="flex gap-4 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 
                      ${comment.user?.role === 'ADMIN' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 'bg-gray-200 text-gray-600'}`}>
                      {getInitials(comment.user)}
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">
                              {getDisplayName(comment.user)}
                              {comment.user?.role === 'ADMIN' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">MOD</span>}
                          </span>
                          <span className="text-xs text-gray-400">• {formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block min-w-[50%]">
                          {comment.text}
                      </p>
                      
                      {(currentUser?.role === 'ADMIN' || (comment.user && currentUser?.id === comment.user.id)) && (
                          <button onClick={() => handleDelete(comment.id)} 
                              className="block mt-1 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                              Usuń wpis
                          </button>
                      )}
                  </div>
              </div>
          ))}
          {comments.length === 0 && !loading && <p className="text-gray-400 italic text-center py-4">Brak komentarzy. Bądź pierwszy!</p>}
      </div>
    </div>
  );
};

export default CommentSection;