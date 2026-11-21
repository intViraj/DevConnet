const express = require('express');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require('../model/connectionRequest');
const User = require('../model/user');

const userRouter = express.Router();

const USER_SAFE_DATA = 'firstName lastName photoUrl age gender about skills';

// GET /user/requests/received
userRouter.get('/user/requests/received', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: 'interested',
    }).populate('fromUserId', USER_SAFE_DATA);

    res.status(200).json({
      message: 'Pending connection requests fetched successfully',
      data: connectionRequests,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error fetching requests: ' + error.message });
  }
});

// GET /user/connections
userRouter.get('/user/connections', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: 'accepted' },
        { fromUserId: loggedInUser._id, status: 'accepted' },
      ],
    })
      .populate('fromUserId', USER_SAFE_DATA + ' emailId')
      .populate('toUserId', USER_SAFE_DATA + ' emailId');

    const connections = connectionRequests.map((row) => {
      const isSender = row.fromUserId._id.toString() === loggedInUser._id.toString();
      const connectedUser = isSender ? row.toUserId : row.fromUserId;
      return {
        ...connectedUser.toObject(),
        connectionId: row._id,
        connectedSince: row.updatedAt || row.createdAt,
      };
    });

    res.status(200).json({
      message: 'Connections fetched successfully',
      data: connections,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error fetching connections: ' + error.message });
  }
});

// GET /user/feed
userRouter.get('/user/feed', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // 1. Find all connection requests sent or received by the logged in user
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select('fromUserId toUserId');

    // 2. Hide users using a fast Set
    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((reqItem) => {
      hideUsersFromFeed.add(reqItem.fromUserId.toString());
      hideUsersFromFeed.add(reqItem.toUserId.toString());
    });
    // Hide loggedInUser themselves
    hideUsersFromFeed.add(loggedInUser._id.toString());

    // 3. Find all discoverable users
    const query = {
      _id: { $nin: Array.from(hideUsersFromFeed) },
    };

    const totalCount = await User.countDocuments(query);

    const users = await User.find(query)
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: 'Feed fetched successfully',
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    res.status(400).json({ message: 'Error fetching feed: ' + error.message });
  }
});

module.exports = userRouter;
