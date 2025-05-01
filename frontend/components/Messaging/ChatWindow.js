import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { 
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import styles from '../../styles/Messaging.module.css';

export default function ChatWindow({ conversation, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;

    // Query messages for this conversation
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversation.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
        setLoading(false);

        // Mark messages as read
        if (conversation.unreadCount > 0) {
          updateDoc(doc(db, 'conversations', conversation.id), {
            [`unreadMessages.${user.uid}`]: 0
          });
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [conversation, user]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateDoc(doc(db, 'conversations', conversation.id), {
        [`typing.${user.uid}`]: true
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateDoc(doc(db, 'conversations', conversation.id), {
        [`typing.${user.uid}`]: false
      });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        conversationId: conversation.id,
        senderId: user.uid,
        text: newMessage.trim(),
        timestamp: Timestamp.now(),
        read: false
      };

      // Add message to messages collection
      await addDoc(collection(db, 'messages'), messageData);

      // Update conversation with last message
      await updateDoc(doc(db, 'conversations', conversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageTime: Timestamp.now(),
        [`unreadMessages.${conversation.otherParticipant.id}`]: increment(1)
      });

      setNewMessage('');
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading messages...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.participantInfo}>
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
          <div>
            <h3>{conversation.otherParticipant.name}</h3>
            <span className={styles.role}>
              {conversation.otherParticipant.role === 'trucker' ? '🚛 Trucker' : '🏢 Property Owner'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <div className={styles.messageContainer}>
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === user.uid;
          const showDate = index === 0 || 
            messages[index - 1].timestamp.toDate().toDateString() !== 
            message.timestamp.toDate().toDateString();

          return (
            <div key={message.id}>
              {showDate && (
                <div className={styles.dateHeader}>
                  {message.timestamp.toDate().toLocaleDateString()}
                </div>
              )}
              <div className={`${styles.message} ${isCurrentUser ? styles.sent : styles.received}`}>
                <div className={styles.messageContent}>
                  <p>{message.text}</p>
                  <span className={styles.timestamp}>
                    {formatMessageTime(message.timestamp)}
                    {isCurrentUser && (
                      <span className={styles.readStatus}>
                        {message.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className={styles.messageInput}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className={styles.sendButton}
        >
          Send
        </button>
      </form>
    </div>
  );
} 