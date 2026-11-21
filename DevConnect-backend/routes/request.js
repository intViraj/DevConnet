const express = require('express');
const mongoose = require('mongoose');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require('../model/connectionRequest');
const User = require('../model/user');

const requestRouter = express.Router();

// POST /request/send/:status/:toUserId
requestRouter.post('/request/send/:status/:toUserId', userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { status, toUserId } = req.params;

    // Validate status
    const allowedStatuses = ['ignored', 'interested'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status '${status}'. Allowed statuses: ${allowedStatuses.join(', ')}` });
    }

    // Validate valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ message: 'Invalid target user ID.' });
    }

    // Prevent sending request to self
    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({ message: 'You cannot send a connection request to yourself!' });
    }

    // Check if recipient user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: 'User you are trying to connect with does not exist.' });
    }

    // Check if there is already an existing connection request in either direction
    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingConnectionRequest) {
      return res.status(400).json({
        message: 'A connection request between you and this user already exists or is already processed.',
      });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const data = await connectionRequest.save();

    const actionText = status === 'interested' ? 'sent a connection request to' : 'passed on';

    res.status(200).json({
      message: `${req.user.firstName} ${actionText} ${toUser.firstName}`,
      data,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error sending request: ' + error.message });
  }
});

// POST /request/review/:status/:requestId
requestRouter.post('/request/review/:status/:requestId', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    // Validate status
    const allowedStatuses = ['accepted', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status '${status}'. Allowed statuses: ${allowedStatuses.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID format.' });
    }

    // Find request where toUserId is logged in user and status is 'interested'
    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: 'interested',
    }).populate('fromUserId', 'firstName lastName photoUrl');

    if (!connectionRequest) {
      return res.status(404).json({
        message: 'Connection request not found or has already been reviewed.',
      });
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();

    res.status(200).json({
      message: `Connection request from ${connectionRequest.fromUserId?.firstName || 'developer'} ${status}!`,
      data,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error reviewing request: ' + error.message });
  }
});

module.exports = requestRouter;
