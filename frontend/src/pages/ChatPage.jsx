import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket, connectSocket } from '../services/socket';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  User,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const { conversationId: paramConvId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [connectionsList, setConnectionsList] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const messagesEndRef = useRef(null);
  const activeConvRef = useRef(null);

  // Keep activeConvRef synchronized with state
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to extract the other participant from a conversation
  const getOtherParticipant = useCallback(
    (conv) => {
      if (!conv || !conv.participants) return null;
      return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0];
    },
    [user]
  );

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      const convs = res.data.data || [];
      setConversations(convs);
      return convs;
    } catch (err) {
      showToast(err.message || 'Failed to load conversations.', 'error');
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, [showToast]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(
    async (convId) => {
      if (!convId) return;
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/messages/${convId}`);
        setMessages(res.data.data || []);
      } catch (err) {
        showToast(err.message || 'Failed to load messages.', 'error');
      } finally {
        setLoadingMessages(false);
      }
    },
    [showToast]
  );

  // Initialize socket and listener
  useEffect(() => {
    const socket = connectSocket();

    const handleReceiveMessage = (incomingMsg) => {
      const currentActive = activeConvRef.current;

      // If the incoming message belongs to currently opened conversation, append it
      if (currentActive && incomingMsg.conversationId === currentActive._id) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === incomingMsg._id)) {
            return prev;
          }
          return [...prev, incomingMsg];
        });
      }

      // Update lastMessage and conversation ordering in sidebar
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id === incomingMsg.conversationId) {
            return {
              ...c,
              lastMessage: incomingMsg,
              updatedAt: incomingMsg.createdAt || new Date().toISOString(),
            };
          }
          return c;
        });

        // Sort conversations with newest updated first
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const handleMessageError = (err) => {
      showToast(err.message || 'Chat error occurred.', 'error');
    };

    const handleConnect = () => {
      if (activeConvRef.current) {
        socket.emit('join_conversation', { conversationId: activeConvRef.current._id });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_error', handleMessageError);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_error', handleMessageError);
      socket.off('connect', handleConnect);
    };
  }, [showToast]);

  // Load conversations on component mount and handle route state
  useEffect(() => {
    const init = async () => {
      const convs = await fetchConversations();

      // Check if routed with specific recipientId (e.g. from Connections page)
      const recipientIdFromState = location.state?.recipientId;
      if (recipientIdFromState) {
        try {
          const res = await api.post('/chat/conversation', { recipientId: recipientIdFromState });
          const targetConv = res.data.data;
          // Refresh list to include this conversation if new
          await fetchConversations();
          handleSelectConversation(targetConv);
          return;
        } catch (e) {
          console.error('Failed to open requested conversation:', e);
        }
      }

      // If URL param specified
      if (paramConvId) {
        const found = convs.find((c) => c._id === paramConvId);
        if (found) {
          handleSelectConversation(found);
          return;
        }
      }

      // Default select first conversation if available
      if (convs.length > 0 && !activeConvRef.current) {
        handleSelectConversation(convs[0]);
      }
    };

    init();
  }, [fetchConversations, location.state, paramConvId]);

  // Switch conversation
  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv._id);

    // Join Socket room
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId: conv._id });
    }
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    const content = newMessage.trim();
    setSending(true);

    const socket = getSocket();
    if (!socket || !socket.connected) {
      showToast('Socket not connected. Reconnecting...', 'error');
      connectSocket();
      setSending(false);
      return;
    }

    socket.emit(
      'send_message',
      {
        conversationId: activeConversation._id,
        content,
      },
      (response) => {
        setSending(false);
        if (response && response.success) {
          setNewMessage('');
          // Append message if not already added by receive_message event
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.data._id)) {
              return prev;
            }
            return [...prev, response.data];
          });
        } else if (response && response.error) {
          showToast(response.error, 'error');
        }
      }
    );
  };

  // Load connections for New Chat modal
  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingConnections(true);
    try {
      const res = await api.get('/user/connections');
      setConnectionsList(res.data.data || []);
    } catch (err) {
      showToast('Failed to load connections.', 'error');
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleStartConversation = async (recipientId) => {
    setShowNewChatModal(false);
    try {
      const res = await api.post('/chat/conversation', { recipientId });
      const targetConv = res.data.data;
      await fetchConversations();
      handleSelectConversation(targetConv);
    } catch (err) {
      showToast(err.message || 'Failed to start conversation.', 'error');
    }
  };

  // Filter conversations in sidebar
  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    if (!other) return false;
    const name = `${other.firstName || ''} ${other.lastName || ''}`.toLowerCase();
    const query = sidebarSearch.toLowerCase();
    return name.includes(query);
  });

  const activeOtherUser = getOtherParticipant(activeConversation);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Container: Left Sidebar & Chat Window */}
      <div className="glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden h-[82vh] flex flex-col md:flex-row">
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/60 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-white text-base">Messages</h2>
            </div>
            <button
              onClick={handleOpenNewChatModal}
              className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1 text-xs font-semibold"
              title="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loadingConversations ? (
              <div className="p-6">
                <LoadingSpinner text="Loading chats..." />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConversation?._id === conv._id;
                const lastMsg = conv.lastMessage;
                const previewText = lastMsg
                  ? typeof lastMsg === 'object' && lastMsg.content
                    ? lastMsg.content
                    : 'Message'
                  : 'No messages yet';

                const timeStr = conv.updatedAt
                  ? new Date(conv.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-purple-600/20 border-l-4 border-purple-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <img
                      src={
                        other?.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                      }
                      alt={other?.firstName || 'Developer'}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-purple-500/30 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">
                          {other?.firstName} {other?.lastName}
                        </h4>
                        {timeStr && (
                          <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {timeStr}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate leading-relaxed">
                        {previewText}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No conversations yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click 'New' above to chat with your connections!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CHAT WINDOW */}
        <div className="flex-1 flex flex-col bg-slate-950/50 h-full">
          {activeConversation && activeOtherUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      activeOtherUser.photoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={activeOtherUser.firstName}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-500/40"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {activeOtherUser.firstName} {activeOtherUser.lastName}
                    </h3>
                    <p className="text-xs text-slate-400">{activeOtherUser.emailId}</p>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <LoadingSpinner text="Fetching chat history..." />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const senderId =
                      typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                    const isMe = senderId === user?._id;
                    const time = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md break-words ${
                            isMe
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {time && (
                          <span className="text-[10px] text-slate-500 mt-1 px-1">
                            {time}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <Sparkles className="w-10 h-10 text-purple-400/40 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">
                      Say hello to {activeOtherUser.firstName}!
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Messages in this conversation are saved permanently in MongoDB and delivered in real-time.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Message ${activeOtherUser.firstName}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 focus:border-purple-500 focus:outline-none text-sm text-white placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Select a conversation
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Choose an existing chat from the left sidebar or start a new conversation with one of your connections.
              </p>
              <button
                onClick={handleOpenNewChatModal}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                Start New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NEW CHAT MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Start a New Conversation
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select one of your connected developers to open a direct private message channel:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingConnections ? (
                <LoadingSpinner text="Loading connections..." />
              ) : connectionsList.length > 0 ? (
                connectionsList.map((conn) => (
                  <button
                    key={conn._id}
                    onClick={() => handleStartConversation(conn._id)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-900/80 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-800 flex items-center gap-3 transition-all"
                  >
                    <img
                      src={
                        conn.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                      }
                      alt={conn.firstName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {conn.firstName} {conn.lastName}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{conn.emailId}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>You have no connections yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Connect with developers in the Feed to start chatting!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
