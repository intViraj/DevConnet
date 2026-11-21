const jwt = require('jsonwebtoken');
const User = require('../model/user');

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Please Login to access this feature!' });
    }

    const secret = process.env.JWT_SECRET || 'DevConnect_Super_Secret_Key_2026_Secure!';
    const decodedObj = jwt.verify(token, secret);
    const { _id } = decodedObj;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed: ' + error.message });
  }
};

module.exports = {
  userAuth,
};
