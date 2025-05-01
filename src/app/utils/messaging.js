import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export const createNewConversation = async (currentUserId, otherUserId, initialMessage) => {
  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    const existingConversation = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(otherUserId);
    });

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation
    const newConversation = await addDoc(conversationsRef, {
      participants: [currentUserId, otherUserId],
      lastMessage: initialMessage,
      lastMessageTimestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 1
      }
    });

    // Add initial message
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      conversationId: newConversation.id,
      senderId: currentUserId,
      text: initialMessage,
      timestamp: serverTimestamp(),
      read: false
    });

    return newConversation.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const formatMessageTimestamp = (timestamp) => {
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

export const getParticipantName = async (userId) => {
  try {
    const userDoc = await getDocs(
      query(collection(db, 'users'), where('uid', '==', userId))
    );
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      return userData.displayName || userData.email;
    }
    return 'Unknown User';
  } catch (error) {
    console.error('Error getting participant name:', error);
    return 'Unknown User';
  }
}; 