import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createNewConversation } from '@/app/utils/messaging';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import styles from '../../styles/Messaging.module.css';

export default function NewConversation({ onConversationCreated, onCancel }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = async (term) => {
    if (term.length < 2) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      // Search for users by email or name
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '>=', term),
        where('email', '<=', term + '\uf8ff'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const userResults = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.uid !== user.uid); // Exclude current user
      
      setUsers(userResults);
      setError('');
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setUsers([]);
    setSearchTerm(selectedUser.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    try {
      setLoading(true);
      const conversationId = await createNewConversation(
        user.uid,
        selectedUser.uid,
        message.trim()
      );
      onConversationCreated(conversationId);
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.newConversation}>
      <div className={styles.header}>
        <h2>New Message</h2>
        <button onClick={onCancel} className={styles.closeButton}>×</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search for a user..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchUsers(e.target.value);
            }}
            className={styles.searchInput}
          />
          
          {loading && <div className={styles.spinner} />}
          
          {users.length > 0 && (
            <ul className={styles.searchResults}>
              {users.map(user => (
                <li
                  key={user.uid}
                  onClick={() => handleUserSelect(user)}
                  className={styles.searchResult}
                >
                  <span className={styles.userEmail}>{user.email}</span>
                  {user.displayName && (
                    <span className={styles.userName}>{user.displayName}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={styles.messageInput}
          disabled={!selectedUser}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={!selectedUser || !message.trim() || loading}
          className={styles.sendButton}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
} 