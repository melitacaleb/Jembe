// src/controllers/postController.js
const Post = require('../models/Post');

const postModel = new Post();

exports.getFeed = async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  const feed = await postModel.getFeedForUser(req.user.id, { limit, offset });
  res.json({ posts: feed });
};

exports.createPost = async (req, res) => {
  const { caption, media_urls, location } = req.body;
  if (!media_urls || !media_urls.length) {
    return res.status(400).json({ error: 'At least one media URL is required' });
  }
  const post = await postModel.insert({
    author_id: req.user.id,
    caption: caption || '',
    media_urls,
    location: location || '',
  });
  res.status(201).json({ post });
};

exports.deletePost = async (req, res) => {
  const post = await postModel.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.author_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
  await postModel.delete(req.params.id);
  res.json({ ok: true });
};

exports.likePost = async (req, res) => {
  await postModel.like(req.params.id, req.user.id);
  res.json({ ok: true });
};

exports.unlikePost = async (req, res) => {
  await postModel.unlike(req.params.id, req.user.id);
  res.json({ ok: true });
};

exports.addComment = async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Comment body required' });
  const comment = await postModel.addComment(req.params.id, req.user.id, body.trim());
  res.status(201).json({ comment });
};

exports.getComments = async (req, res) => {
  const comments = await postModel.getComments(req.params.id);
  res.json({ comments });
};
