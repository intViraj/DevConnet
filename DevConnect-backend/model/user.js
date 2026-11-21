const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      minLength: [2, 'First name must be at least 2 characters'],
      maxLength: [50, 'First name cannot exceed 50 characters'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      maxLength: [50, 'Last name cannot exceed 50 characters'],
      default: '',
    },
    emailId: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Invalid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Security: excluded by default in queries
    },
    age: {
      type: Number,
      min: [16, 'Age must be at least 16'],
      max: [120, 'Age must be below 120'],
    },
    gender: {
      type: String,
      lowercase: true,
      enum: {
        values: ['male', 'female', 'other', 'prefer_not_to_say'],
        message: '{VALUE} is not a valid gender option',
      },
    },
    photoUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      validate: {
        validator: function (value) {
          if (!value) return true;
          return validator.isURL(value, { require_protocol: true });
        },
        message: 'Invalid URL for profile picture',
      },
    },
    about: {
      type: String,
      default: 'Passionate developer looking to connect, collaborate, and build amazing products together!',
      maxLength: [500, 'About cannot exceed 500 characters'],
      trim: true,
    },
    skills: {
      type: [String],
      validate: {
        validator: (val) => Array.isArray(val) && val.length <= 30,
        message: 'Cannot have more than 30 skills',
      },
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Instance method to generate JWT
userSchema.methods.getJWT = function () {
  const user = this;
  const secret = process.env.JWT_SECRET || 'DevConnect_Super_Secret_Key_2026_Secure!';
  const token = jwt.sign({ _id: user._id }, secret, {
    expiresIn: '7d',
  });
  return token;
};

// Instance method to validate user password
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;
  const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);
  return isPasswordValid;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
