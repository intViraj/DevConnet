const validator = require('validator');

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
    throw new Error('First name must be between 2 and 50 characters.');
  }

  if (lastName && lastName.trim().length > 50) {
    throw new Error('Last name cannot exceed 50 characters.');
  }

  if (!emailId || !validator.isEmail(emailId)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || !validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0, // friendly strong password requirement: min 8, uppercase, lowercase, number
  })) {
    throw new Error('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.');
  }
};

const validateEditProfileData = (req) => {
  const ALLOWED_UPDATES = [
    'firstName',
    'lastName',
    'photoUrl',
    'gender',
    'age',
    'about',
    'skills',
  ];

  const incomingFields = Object.keys(req.body);
  if (incomingFields.length === 0) {
    throw new Error('No fields provided to update.');
  }

  const isEditAllowed = incomingFields.every((field) => ALLOWED_UPDATES.includes(field));
  if (!isEditAllowed) {
    const forbiddenFields = incomingFields.filter((field) => !ALLOWED_UPDATES.includes(field));
    throw new Error(`Updating sensitive or disallowed fields is blocked: ${forbiddenFields.join(', ')}`);
  }

  const { photoUrl, age, gender, about, skills, firstName, lastName } = req.body;

  if (firstName !== undefined && (firstName.trim().length < 2 || firstName.trim().length > 50)) {
    throw new Error('First name must be between 2 and 50 characters.');
  }

  if (lastName !== undefined && lastName.trim().length > 50) {
    throw new Error('Last name cannot exceed 50 characters.');
  }

  if (photoUrl !== undefined && photoUrl !== '' && !validator.isURL(photoUrl, { require_protocol: true })) {
    throw new Error('Photo URL must be a valid web URL (e.g. https://...).');
  }

  if (age !== undefined && (typeof age !== 'number' || age < 16 || age > 120)) {
    throw new Error('Age must be a valid number between 16 and 120.');
  }

  if (gender !== undefined && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender.toLowerCase())) {
    throw new Error('Gender must be one of: male, female, other, prefer_not_to_say.');
  }

  if (about !== undefined && about.length > 500) {
    throw new Error('About section cannot exceed 500 characters.');
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      throw new Error('Skills must be an array of strings.');
    }
    if (skills.length > 30) {
      throw new Error('You cannot list more than 30 skills.');
    }
  }

  return true;
};

module.exports = {
  validateSignUpData,
  validateEditProfileData,
};
