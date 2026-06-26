// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const userModel = new User();

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, account_type: user.account_type },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

exports.register = async (req, res) => {
  try {
    const {
      username, email, password, full_name,
      account_type, org_category, org_website, location,
    } = req.body;

    if (!username || !email || !password || !full_name || !account_type) {
      return res.status(400).json({ error: 'username, email, password, full_name and account_type are required' });
    }
    if (!['individual', 'organization'].includes(account_type)) {
      return res.status(400).json({ error: "account_type must be 'individual' or 'organization'" });
    }
    if (account_type === 'organization' && !org_category) {
      return res.status(400).json({ error: 'org_category is required for organization accounts' });
    }

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });
    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) return res.status(409).json({ error: 'Username already taken' });

    const password_hash = await User.hashPassword(password);

    const newUser = await userModel.insert({
      username, email, password_hash, full_name, account_type,
      org_category: account_type === 'organization' ? org_category : null,
      org_website: account_type === 'organization' ? (org_website || null) : null,
      location: location || '',
    });

    const token = signToken(newUser);
    res.status(201).json({ token, user: User.toPublic(newUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: User.toPublic(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.me = async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: User.toPublic(user) });
};
