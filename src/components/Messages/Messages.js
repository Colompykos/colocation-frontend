import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Messages.css";
import { db } from "../../config/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  where, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  getDoc, 
  updateDoc, 
  arrayUnion
} from "firebase/firestore";

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRecipientId = searchParams.get("recipientId");
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const chatContentRef = useRef(null);
  
  useEffect(() => {
    if (!user) return;
    
    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );
    
    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const conversationsPromises = snapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        
        const otherParticipantId = chatData.participants.find(id => id !== user.uid);
        if (!otherParticipantId) return null;
        
        const userDocRef = doc(db, "users", otherParticipantId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) return null;
        
        const userData = userDocSnap.data();
        
        const messagesQuery = query(
          collection(db, "chats", chatId, "messages"),
          where("deleted", "==", false),
          orderBy("timestamp", "desc")
        );
        
        const messagesSnap = await getDocs(messagesQuery);
        
        let lastMessage = null;
        if (!messagesSnap.empty) {
          const lastMessageDoc = messagesSnap.docs[0];
          lastMessage = {
            id: lastMessageDoc.id,
            ...lastMessageDoc.data(),
            timestamp: lastMessageDoc.data().timestamp?.toDate() || null
          };
        }
        
        const unreadQuery = query(
          collection(db, "chats", chatId, "messages"),
          where("senderId", "==", otherParticipantId),
          where("read", "==", false)
        );
        
        const unreadSnap = await getDocs(unreadQuery);
        const unreadCount = unreadSnap.docs.length;
        
        return {
          id: chatId,
          otherUser: {
            id: otherParticipantId,
            displayName: userData.displayName || "User",
            photoURL: userData.photoURL || null
          },
          lastMessage,
          updatedAt: chatData.updatedAt?.toDate() || null,
          unreadCount
        };
      });
      
      const conversationsData = await Promise.all(conversationsPromises);
      const filteredConversations = conversationsData.filter(conv => conv !== null);
      
      filteredConversations.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || a.updatedAt || 0;
        const timeB = b.lastMessage?.timestamp || b.updatedAt || 0;
        return new Date(timeB) - new Date(timeA);
      });
      
      setConversations(filteredConversations);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  const markMessagesAsRead = useCallback(async (chatId) => {
    if (!user || !chatId) return;
    
    try {
      const unreadQuery = query(
        collection(db, "chats", chatId, "messages"),
        where("senderId", "!=", user.uid),
        where("read", "==", false)
      );
      
      const unreadSnap = await getDocs(unreadQuery);
      
      const updatePromises = unreadSnap.docs.map(docSnap => 
        updateDoc(doc(db, "chats", chatId, "messages", docSnap.id), {
          read: true,
          readAt: serverTimestamp()
        })
      );
      
      await Promise.all(updatePromises);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === chatId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user]);

  const initializeChat = useCallback(async (recipientId) => {
    if (!user || !recipientId) return;
  
    if (currentChat?.otherUser?.id === recipientId) return;
  
    const existingConversation = conversations.find(
      (conv) => conv.otherUser && conv.otherUser.id === recipientId
    );
  
    if (existingConversation) {
      setCurrentChat(existingConversation);
      markMessagesAsRead(existingConversation.id);
      return;
    }
  
    try {
      setLoading(true);
  
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", user.uid));
      const querySnapshot = await getDocs(q);
  
      let existingChatId = null;
      querySnapshot.forEach((doc) => {
        const participants = doc.data().participants || [];
        if (participants.includes(recipientId)) {
          existingChatId = doc.id;
        }
      });
  
      let chatId;
      if (existingChatId) {
        chatId = existingChatId;
        console.log("Found existing chat:", chatId);
      } else {
        const chatRef = await addDoc(collection(db, "chats"), {
          participants: [user.uid, recipientId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        chatId = chatRef.id;
        console.log("Created new chat with ID:", chatId);
      }
  
      const recipientRef = doc(db, "users", recipientId);
      const recipientSnap = await getDoc(recipientRef);
  
      let recipientData = recipientSnap.exists() ? recipientSnap.data() : {};
  
      console.log("Recipient data:", recipientData);
  
      const newConversation = {
        id: chatId,
        otherUser: {
          id: recipientId,
          displayName: recipientData.displayName,
          photoURL: recipientData.photoURL,
        },
        unreadCount: 0,
      };
  
      setCurrentChat(newConversation);
  
      setConversations((prev) => {
        if (!prev.some((conv) => conv.id === chatId)) {
          return [...prev, newConversation];
        }
        return prev;
      });
    } catch (error) {
      console.error("Error initializing chat:", error);
      setError(`Failed to load chat: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [user, conversations, markMessagesAsRead, currentChat]);
  
  useEffect(() => {
    if (!currentChat || !user) return;
    
    const messagesRef = collection(db, "chats", currentChat.id, "messages");
    const q = query(
      messagesRef, 
      where("deleted", "==", false),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setMessages(updatedMessages);
      
      const newUnreadMessages = updatedMessages.filter(
        msg => !msg.read && msg.senderId !== user.uid
      );
      
      if (newUnreadMessages.length > 0) {
        markMessagesAsRead(currentChat.id);
      }
    });
    
    return () => unsubscribe();
  }, [currentChat, user, markMessagesAsRead]);
  
  useEffect(() => {
    if (!user) return;
    
    const typingRef = collection(db, "typing");
    
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const typingData = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId !== user.uid) {
          typingData[data.userId] = {
            userId: data.userId,
            isTyping: data.isTyping,
            chatId: data.chatId,
            timestamp: data.timestamp?.toDate() || new Date()
          };
        }
      });
      
      setTypingUsers(typingData);
    });
    
    return () => unsubscribe();
  }, [user]);

  const updateTypingStatus = async (isTyping) => {
    if (!currentChat || !user) return;
    
    try {
      const typingDocRef = doc(db, "typing", `${currentChat.id}_${user.uid}`);
      
      await setDoc(typingDocRef, {
        chatId: currentChat.id,
        userId: user.uid,
        isTyping,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };
  
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim().length > 0) {
      updateTypingStatus(true);
      
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, 2000);
    } else {
      updateTypingStatus(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat || !user) return;
    
    try {
      updateTypingStatus(false);
      
      const messageData = {
        senderId: user.uid,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        deleted: false
      };
      
      await addDoc(
        collection(db, "chats", currentChat.id, "messages"), 
        messageData
      );
      
      await updateDoc(doc(db, "chats", currentChat.id), {
        lastMessage: {
          senderId: user.uid,
          message: newMessage.trim(),
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };
  
  useEffect(() => {
    return () => {
      if (currentChat && user) {
        updateTypingStatus(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentChat, user]);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date)) return "";
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  
  useEffect(() => {
    if (initialRecipientId && user && !loading) {
      console.log("Initializing chat with recipient from URL:", initialRecipientId);
      initializeChat(initialRecipientId);
    }
  }, [initialRecipientId, user, loading, initializeChat]);

  if (!user) {
    return (
      <div className="messages-container">
        <div className="messages-empty">
          <h2>Please sign in to access messages</h2>
          <button onClick={() => navigate("/login")} className="login-button">
            Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="conversations-header">
          <h2>Messages</h2>
        </div>
        
        <div className="conversations-list">
          {loading && conversations.length === 0 ? (
            <div className="loading-spinner">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <button onClick={() => navigate("/search")}>
                Find students to message
              </button>
            </div>
          ) : (
            conversations.map(conversation => (
              <div 
                key={conversation.id}
                className={`conversation-item ${currentChat?.id === conversation.id ? 'active' : ''}`}
                onClick={() => initializeChat(conversation.otherUser.id)}
              >
                <div className="conversation-avatar">
                  <img 
                    src={conversation.otherUser.photoURL || "/Images/default-avatar.png"} 
                    alt={conversation.otherUser.displayName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/Images/default-avatar.png";
                    }}
                  />
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {conversation.otherUser.displayName}
                  </div>
                  {Object.values(typingUsers).some(user => 
                    conversation.otherUser.id === user.userId && user.isTyping && user.chatId === conversation.id
                  ) ? (
                    <div className="conversation-preview typing">
                      <div className="typing-preview-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  ) : conversation.lastMessage && (
                    <div className="conversation-preview">
                      {conversation.lastMessage.senderId === user.uid ? 'You: ' : ''}
                      {conversation.lastMessage.message}
                    </div>
                  )}
                </div>
                <div className="conversation-meta">
                  {conversation.lastMessage && (
                    <div className="conversation-time">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </div>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div className="unread-badge">{conversation.unreadCount}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="messages-content">
        {currentChat ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <img 
                  src={currentChat.otherUser.photoURL || "/Images/default-avatar.png"} 
                  alt={currentChat.otherUser.displayName}
                  className="chat-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/Images/default-avatar.png";
                  }}
                />
                <div className="user-status">
                  <h3>{currentChat.otherUser.displayName}</h3>
                  {Object.values(typingUsers).some(user => 
                    user.isTyping && 
                    user.chatId === currentChat.id && 
                    user.userId === currentChat.otherUser.id
                  ) && (
                    <div className="typing-indicator">typing...</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="chat-messages" ref={chatContentRef}>
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwnMessage = msg.senderId === user.uid;
                  return (
                    <div 
                      key={msg.id || msg.timestamp} 
                      className={`message-bubble ${isOwnMessage ? 'sent' : 'received'}`}
                    >
                      <div className="message-text">{msg.message}</div>
                      <div className="message-time">
                        {formatTime(msg.timestamp)}
                        {isOwnMessage && (
                          <span className="message-status">
                            {msg.read ? ' ✓✓' : ' ✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {Object.values(typingUsers).some(user => 
                user.isTyping && 
                user.chatId === currentChat.id && 
                user.userId === currentChat.otherUser.id
              ) && (
                <div className="message-bubble received typing-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <form className="message-input-container" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={handleMessageChange} 
                placeholder="Type your message..."
                className="message-input"
                id="message-input"
                name="messageText"
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={!newMessage.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </>
        ) : (
          <div className="select-conversation">
            <div className="no-chat-selected">
              <i className="fas fa-comment-dots"></i>
              <h3>Select a conversation</h3>
              <p>Choose an existing conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;