const express = require('express');
const mongoose = require('mongoose');
const { userAuth } = require('../middlewares/auth');
const Conversation = require('../model/conversation');
const Message = require('../model/message');
const User = require('../model/user');

const chatRouter = express.Router();

const USER_SAFE_FIELDS = 'firstName lastName photoUrl emailId';

// POST /chat/conversation - Create or retrieve a one-to-one conversation
chatRouter.post('/chat/conversation', userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const recipientId = req.body.recipientId || req.body.participantId;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient user ID is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient ID format.' });
    }

    if (loggedInUserId.toString() === recipientId.toString()) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself.' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    // Find existing conversation between the two participants
    let conversation = await Conversation.findOne({
      participants: { $all: [loggedInUserId, recipientId], $size: 2 },
    })
      .populate('participants', USER_SAFE_FIELDS)
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt',
      });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [loggedInUserId, recipientId],
      });
      await conversation.save();

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        USER_SAFE_FIELDS
      );
    }

    res.status(200).json({
      message: 'Conversation retrieved successfully',
      data: conversation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving conversation: ' + error.message });
  }
});

// GET /chat/conversations - Fetch all conversations for the logged-in user
chatRouter.get('/chat/conversations', userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: loggedInUserId,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', USER_SAFE_FIELDS)
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt',
      });

    res.status(200).json({
      message: 'Conversations fetched successfully',
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations: ' + error.message });
  }
});

// GET /chat/messages/:conversationId - Fetch messages of a particular conversation
chatRouter.get('/chat/messages/:conversationId', userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID format.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Security check: Only conversation participants can access its messages
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === loggedInUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        message: 'Access denied. You are not a participant in this conversation.',
      });
    }

    // Fetch messages in chronological order (oldest to newest)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName photoUrl');

    res.status(200).json({
      message: 'Messages fetched successfully',
      data: messages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages: ' + error.message });
  }
});

module.exports = chatRouter;
