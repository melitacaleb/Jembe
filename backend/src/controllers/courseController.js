// src/controllers/courseController.js
const Course = require('../models/Course');

const courseModel = new Course();

exports.list = async (req, res) => {
  const { category } = req.query;
  const limit = Number(req.query.limit) || 30;
  const offset = Number(req.query.offset) || 0;
  const courses = await courseModel.listPublished({ category, limit, offset });
  res.json({ courses });
};

// Only organization accounts can publish courses (enforced via requireOrganization middleware)
exports.create = async (req, res) => {
  const { title, description, category, cover_url, content_url } = req.body;
  if (!title || !content_url) return res.status(400).json({ error: 'title and content_url are required' });
  const course = await courseModel.insert({
    provider_id: req.user.id,
    title, description: description || '', category: category || 'General',
    cover_url: cover_url || '', content_url,
  });
  res.status(201).json({ course });
};

exports.mine = async (req, res) => {
  const courses = await courseModel.getByProvider(req.user.id);
  res.json({ courses });
};

exports.enroll = async (req, res) => {
  const enrollment = await courseModel.enroll(req.params.id, req.user.id);
  res.json({ enrollment });
};

exports.myEnrollments = async (req, res) => {
  const enrollments = await courseModel.getEnrollmentsForUser(req.user.id);
  res.json({ enrollments });
};

exports.updateProgress = async (req, res) => {
  const { progress } = req.body;
  const updated = await courseModel.updateProgress(req.params.id, req.user.id, Math.min(100, Math.max(0, Number(progress) || 0)));
  res.json({ enrollment: updated });
};
