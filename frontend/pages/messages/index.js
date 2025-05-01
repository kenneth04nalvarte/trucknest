import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import MessageList from '../../components/Messaging/MessageList';
import ChatWindow from '../../components/Messaging/ChatWindow';
import NewConversation from '../../components/Messaging/NewConversation';
import styles from '../../styles/Messaging.module.css';

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setIsMobileListVisible(false);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    setIsMobileListVisible(true);
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  const handleConversationCreated = (conversationId) => {
    setShowNewConversation(false);
    setSelectedConversation({ id: conversationId });
    setIsMobileListVisible(false);
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <p>Please sign in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messagingLayout}>
        <div className={`${styles.sidebar} ${!isMobileListVisible ? styles.hiddenMobile : ''}`}>
          <div className={styles.sidebarHeader}>
            <h1>Messages</h1>
            <button 
              onClick={handleNewConversation}
              className={styles.newMessageButton}
            >
              New Message
            </button>
          </div>
          <MessageList onSelectConversation={handleSelectConversation} />
        </div>
        
        <div className={`${styles.mainContent} ${isMobileListVisible ? styles.hiddenMobile : ''}`}>
          {selectedConversation ? (
            <ChatWindow 
              conversation={selectedConversation} 
              onClose={handleCloseChat}
            />
          ) : (
            <div className={styles.noChat}>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {showNewConversation && (
        <NewConversation
          onConversationCreated={handleConversationCreated}
          onCancel={() => setShowNewConversation(false)}
        />
      )}
    </div>
  );
} 