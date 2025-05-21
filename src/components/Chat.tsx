import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface ChatProps {
  conversationId: string;
  userId: string;
}

export default function Chat({ conversationId, userId }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [conversationId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: userId,
      text,
      createdAt: serverTimestamp(),
    });
    setText('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="border rounded p-4 mb-2 h-64 overflow-y-auto bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`mb-2 ${msg.senderId === userId ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-1 rounded-lg ${msg.senderId === userId ? 'bg-orange text-white' : 'bg-navy text-white'}`}>{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="bg-orange text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
} 