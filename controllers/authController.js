// controllers/authController.js
const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// POST /api/register
async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await UserModel.create({ name, email, phone, hashedPassword });
    const user = await UserModel.findById(userId);
    const token = generateToken(user);

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
}

// POST /api/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    delete user.password;
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
}

// GET /api/profile (protected)
async function getProfile(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile };
