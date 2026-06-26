// src/controllers/userController.js
const User = require('../models/User');
const Post = require('../models/Post');

const userModel = new User();
const postModel = new Post();

exports.getProfile = async (req, res) => {
  const user = await userModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const counts = await userModel.getFollowCounts(user.id);
  const posts = await postModel.getByAuthor(user.id, { limit: 24 });
  res.json({ user: User.toPublic(user), counts, posts });
};

exports.updateProfile = async (req, res) => {
  if (req.params.id !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
  const allowed = ['full_name', 'bio', 'avatar_url', 'cover_url', 'location', 'org_website'];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  data.updated_at = new Date();
  const updated = await userModel.update(req.params.id, data);
  res.json({ user: User.toPublic(updated) });
};

exports.search = async (req, res) => {
  const term = req.query.q || '';
  if (!term.trim()) return res.json({ results: [] });
  const results = await userModel.search(term);
  res.json({ results });
};

exports.follow = async (req, res) => {
  try {
    await userModel.follow(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.unfollow = async (req, res) => {
  await userModel.unfollow(req.user.id, req.params.id);
  res.json({ ok: true });
};
