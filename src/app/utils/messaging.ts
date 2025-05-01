import { db } from '@/config/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage: Message
  updatedAt: string
}

export async function getOrCreateConversation(currentUserId: string, otherUserId: string): Promise<string> {
  try {
    // Check if conversation already exists
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUserId)
    )
    const snapshot = await getDocs(conversationsQuery)
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as Conversation
      if (data.participants.includes(otherUserId)) {
        return doc.id
      }
    }

    // Create new conversation
    const conversationRef = await addDoc(collection(db, 'conversations'), {
      participants: [currentUserId, otherUserId],
      updatedAt: new Date().toISOString()
    })

    return conversationRef.id
  } catch (err) {
    console.error('Error getting or creating conversation:', err)
    throw new Error('Failed to get or create conversation')
  }
}

export async function sendMessage(conversationId: string, message: Omit<Message, 'id'>): Promise<void> {
  try {
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      ...message,
      timestamp: new Date().toISOString()
    })

    // Update conversation's last message and timestamp
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: message,
      updatedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('Error sending message:', err)
    throw new Error('Failed to send message')
  }
}

export async function markMessageAsRead(messageId: string, conversationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
      read: true
    })
  } catch (err) {
    console.error('Error marking message as read:', err)
    throw new Error('Failed to mark message as read')
  }
} 