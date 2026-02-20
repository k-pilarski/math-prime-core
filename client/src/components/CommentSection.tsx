import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
  isBlocked?: boolean;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  parentId: string | null;
  user: User;
  replies?: Comment[];
}

interface Props {
  lessonId: string;
}

const CommentSection = ({ lessonId }: Props) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
      e.preventDefault();
      const textToSend = parentId ? replyText : newComment;
      if (!textToSend.trim()) return;
      
      const token = localStorage.getItem('token');
      if (!token) return alert("Zaloguj się, aby komentować.");

      try {
          await axios.post('http://localhost:3000/api/comments', 
            { text: textToSend, lessonId, parentId }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (parentId) {
              setReplyText('');
              setReplyingToId(null);
          } else {
              setNewComment('');
          }
          fetchComments();
      } catch (err: any) { 
          alert(err.response?.data?.error || "Błąd dodawania komentarza"); 
      }
  };

  const handleDelete = async (commentId: string) => {
      if (!confirm("Usunąć ten komentarz? Znikną również wszystkie odpowiedzi.")) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`http://localhost:3000/api/comments/${commentId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          fetchComments();
      } catch (err) { alert("Nie możesz usunąć tego komentarza."); }
  };

  const handleToggleBlock = async (userId: string, isCurrentlyBlocked: boolean) => {
      const action = isCurrentlyBlocked ? "Odblokować" : "Zablokować";
      if (!confirm(`Czy na pewno chcesz ${action} tego użytkownika?`)) return;
      
      const token = localStorage.getItem('token');
      try {
          await axios.put(`http://localhost:3000/api/comments/user/${userId}/block`, {}, {
              headers: { Authorization: `Bearer ${token}` }
          });
          fetchComments();
      } catch (err) { alert("Błąd przy zmianie statusu blokady"); }
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

  const renderCommentBody = (comment: Comment, isReply = false) => (
      <div className="flex gap-4 group w-full">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shrink-0 
              ${comment.user?.role === 'ADMIN' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 'bg-gray-200 text-gray-600'}`}>
              {getInitials(comment.user)}
          </div>
          <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 text-sm md:text-base">
                      {getDisplayName(comment.user)}
                      {comment.user?.role === 'ADMIN' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">MOD</span>}
                      {comment.user?.isBlocked && <span className="ml-2 text-xs text-red-600 font-bold">(Zablokowany)</span>}
                  </span>
                  <span className="text-xs text-gray-400">• {formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block min-w-[50%]">
                  {comment.text}
              </p>
              
              <div className="flex gap-4 mt-1">
                  {!isReply && currentUser && !currentUser.isBlocked && (
                       <button onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)} 
                               className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                           Odpowiedz
                       </button>
                  )}

                  {(currentUser?.role === 'ADMIN' || (comment.user && currentUser?.id === comment.user.id)) && (
                      <button onClick={() => handleDelete(comment.id)} 
                          className="text-xs text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                          Usuń wpis
                      </button>
                  )}
                  
                  {currentUser?.role === 'ADMIN' && comment.user && comment.user.id !== currentUser.id && (
                      <button onClick={() => handleToggleBlock(comment.user.id, !!comment.user.isBlocked)} 
                          className={`text-xs opacity-0 group-hover:opacity-100 transition font-bold ${comment.user.isBlocked ? 'text-green-500 hover:text-green-700' : 'text-orange-500 hover:text-orange-700'}`}>
                          {comment.user.isBlocked ? "✅ Odblokuj" : "🚫 Zablokuj"}
                      </button>
                  )}
              </div>

              {replyingToId === comment.id && !isReply && (
                  <form onSubmit={(e) => handleAddComment(e, comment.id)} className="mt-4 flex gap-3">
                      <div className="flex-1">
                          <textarea 
                              autoFocus
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Napisz odpowiedź..."
                              className="w-full p-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px]"
                          />
                          <div className="flex gap-2 mt-2">
                              <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 text-sm rounded font-bold hover:bg-indigo-700">Odpowiedz</button>
                              <button type="button" onClick={() => { setReplyingToId(null); setReplyText(''); }} className="bg-gray-200 text-gray-700 px-4 py-1.5 text-sm rounded font-bold hover:bg-gray-300">Anuluj</button>
                          </div>
                      </div>
                  </form>
              )}
          </div>
      </div>
  );

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">💬 Dyskusja ({comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)})</h3>

      <form onSubmit={(e) => handleAddComment(e, null)} className="mb-8 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
              {currentUser ? getInitials(currentUser) : '?'}
          </div>
          <div className="flex-1">
              <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Zadaj pytanie lub podziel się opinią..."
                  disabled={currentUser?.isBlocked}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px] disabled:bg-gray-100"
              />
              <button type="submit" disabled={currentUser?.isBlocked} className="mt-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                  Opublikuj
              </button>
              {currentUser?.isBlocked && <p className="text-red-500 text-sm mt-2 font-bold">Twoje konto zostało zablokowane. Nie możesz komentować.</p>}
          </div>
      </form>

      <div className="space-y-8">
          {loading ? <p>Ładowanie komentarzy...</p> : comments.map(comment => (
              <div key={comment.id} className="flex flex-col">
                  {renderCommentBody(comment, false)}

                  {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-10 md:ml-14 mt-4 space-y-4 border-l-2 border-indigo-100 pl-4">
                          {comment.replies.map(reply => (
                              <div key={reply.id}>
                                  {renderCommentBody(reply, true)}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          ))}
          {comments.length === 0 && !loading && <p className="text-gray-400 italic text-center py-4">Brak komentarzy. Bądź pierwszy!</p>}
      </div>
    </div>
  );
};

export default CommentSection;