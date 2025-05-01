import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import styles from '../../styles/Messaging.module.css';

export default function MessageList({ onSelectConversation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Query conversations where the current user is a participant
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const conversationsData = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          // Get other participant's info
          const otherParticipantId = data.participants.find(id => id !== user.uid);
          const userDoc = await db.collection('users').doc(otherParticipantId).get();
          const otherParticipant = userDoc.data();

          conversationsData.push({
            id: doc.id,
            ...data,
            otherParticipant: {
              id: otherParticipantId,
              name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
              role: otherParticipant.role,
              avatar: otherParticipant.avatar
            },
            unreadCount: data.unreadMessages?.[user.uid] || 0
          });
        }

        setConversations(conversationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Within a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading conversations...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.messageList}>
      {conversations.length === 0 ? (
        <div className={styles.noMessages}>
          <p>No conversations yet</p>
        </div>
      ) : (
        conversations.map(conversation => (
          <div
            key={conversation.id}
            className={`${styles.conversationItem} ${conversation.unreadCount > 0 ? styles.unread : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className={styles.avatar}>
              {conversation.otherParticipant.avatar ? (
                <img 
                  src={conversation.otherParticipant.avatar} 
                  alt={conversation.otherParticipant.name}
                />
              ) : (
                <div className={styles.defaultAvatar}>
                  {conversation.otherParticipant.name[0]}
                </div>
              )}
            </div>
            
            <div className={styles.conversationInfo}>
              <div className={styles.header}>
                <h3>{conversation.otherParticipant.name}</h3>
                <span className={styles.time}>
                  {formatLastMessageTime(conversation.lastMessageTime)}
                </span>
              </div>
              
              <div className={styles.preview}>
                <p>{conversation.lastMessage}</p>
                {conversation.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              
              <div className={styles.role}>
                {conversation.otherParticipant.role === 'trucker' ? '🚛' : '🏢'} 
                {conversation.otherParticipant.role === 'trucker' ? 'Trucker' : 'Property Owner'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 