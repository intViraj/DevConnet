const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./model/user');
const Conversation = require('./model/conversation');
const Message = require('./model/message');

const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
};

const initializeSocket = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Fallback: Check cookies in handshake headers
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token) {
        return next(new Error('Authentication failed: Missing token.'));
      }

      const secret = process.env.JWT_SECRET || 'DevConnect_Super_Secret_Key_2026_Secure!';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded._id);

      if (!user) {
        return next(new Error('Authentication failed: User not found.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.firstName} (${socket.user._id})`);

    // Client joins a specific conversation room
    socket.on('join_conversation', async (data, callback) => {
      try {
        const conversationId = typeof data === 'string' ? data : data?.conversationId;

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          const errMsg = 'Invalid conversation ID format.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          const errMsg = 'Conversation not found.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        // Verify that the user is a participant
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );
        if (!isParticipant) {
          const errMsg = 'Unauthorized: You are not a participant in this conversation.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        socket.join(conversationId);
        if (typeof callback === 'function') callback({ success: true, conversationId });
      } catch (err) {
        socket.emit('message_error', { message: err.message });
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Client sends a message
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, content } = data || {};

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          const errMsg = 'Invalid conversation ID.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
          const errMsg = 'Message content cannot be empty.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        // Verify conversation membership
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          const errMsg = 'Conversation not found.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );
        if (!isParticipant) {
          const errMsg = 'Unauthorized: You cannot send messages to this conversation.';
          socket.emit('message_error', { message: errMsg });
          if (typeof callback === 'function') callback({ success: false, error: errMsg });
          return;
        }

        // 1. Permanently save message in MongoDB
        const message = new Message({
          conversationId,
          sender: socket.user._id, // Strictly derived from authenticated socket
          content: content.trim(),
          createdAt: new Date(),
        });

        const savedMessage = await message.save();

        // 2. Update conversation lastMessage & updatedAt
        conversation.lastMessage = savedMessage._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // 3. Populate sender information
        await savedMessage.populate('sender', 'firstName lastName photoUrl');

        // 4. Ensure sender's socket is in the room so all participants receive it
        socket.join(conversationId);

        // 5. Broadcast to all participants in the conversation room
        io.to(conversationId).emit('receive_message', savedMessage);

        if (typeof callback === 'function') {
          callback({ success: true, data: savedMessage });
        }
      } catch (err) {
        console.error('[Socket Send Error]:', err.message);
        socket.emit('message_error', { message: err.message });
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.user.firstName} (${reason})`);
    });
  });

  return io;
};

module.exports = { initializeSocket };
