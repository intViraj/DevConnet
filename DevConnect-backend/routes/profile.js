const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { userAuth } = require('../middlewares/auth');
const { validateEditProfileData } = require('../utils/validation');
const User = require('../model/user');

const profileRouter = express.Router();

// GET /profile/view
profileRouter.get('/profile/view', userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      message: 'Profile fetched successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error fetching profile: ' + error.message });
  }
});

// PATCH /profile/edit
profileRouter.patch('/profile/edit', userAuth, async (req, res) => {
  try {
    validateEditProfileData(req);

    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => {
      loggedInUser[key] = req.body[key];
    });

    await loggedInUser.save();

    res.status(200).json({
      message: `${loggedInUser.firstName}, your profile was updated successfully!`,
      data: loggedInUser,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile: ' + error.message });
  }
});

// PATCH /profile/password
profileRouter.patch('/profile/password', userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required.' });
    }

    const userWithPassword = await User.findById(req.user._id).select('+password');
    const isCurrentValid = await userWithPassword.validatePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Current password does not match.' });
    }

    if (!validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    userWithPassword.password = await bcrypt.hash(newPassword, 10);
    await userWithPassword.save();

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating password: ' + error.message });
  }
});

module.exports = profileRouter;
