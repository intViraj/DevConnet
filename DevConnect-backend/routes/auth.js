const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../model/user');
const { validateSignUpData } = require('../utils/validation');

const authRouter = express.Router();

const COOKIE_OPTIONS = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

// POST /signup
authRouter.post('/signup', async (req, res) => {
  try {
    // 1. Validation
    validateSignUpData(req);

    const { firstName, lastName, emailId, password, age, gender, photoUrl, about, skills } = req.body;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ emailId: emailId.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    // 3. Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create and save user
    const newUser = new User({
      firstName,
      lastName: lastName || '',
      emailId: emailId.toLowerCase(),
      password: passwordHash,
      age: age ? Number(age) : undefined,
      gender,
      photoUrl: photoUrl && photoUrl.trim() !== '' ? photoUrl : undefined,
      about: about && about.trim() !== '' ? about : undefined,
      skills: Array.isArray(skills) ? skills : [],
    });

    const savedUser = await newUser.save();

    // 5. Generate JWT and set HTTP-only cookie
    const token = savedUser.getJWT();
    res.cookie('token', token, COOKIE_OPTIONS);

    // 6. Return response without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Account created successfully!',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /Login & /login
const handleLogin = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!validator.isEmail(emailId)) {
      return res.status(400).json({ message: 'Invalid email address format.' });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ emailId: emailId.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    // Generate JWT and set HTTP-only cookie
    const token = user.getJWT();
    res.cookie('token', token, COOKIE_OPTIONS);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Logged in successfully!',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

authRouter.post('/Login', handleLogin);
authRouter.post('/login', handleLogin);

// POST /Logout & /logout
const handleLogout = async (req, res) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully!' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

authRouter.post('/Logout', handleLogout);
authRouter.post('/logout', handleLogout);

module.exports = authRouter;
