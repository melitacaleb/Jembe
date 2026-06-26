const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postController');
const { requireAuth } = require('../middleware/auth');

router.get('/feed', requireAuth, ctrl.getFeed);
router.post('/', requireAuth, ctrl.createPost);
router.delete('/:id', requireAuth, ctrl.deletePost);
router.post('/:id/like', requireAuth, ctrl.likePost);
router.delete('/:id/like', requireAuth, ctrl.unlikePost);
router.get('/:id/comments', requireAuth, ctrl.getComments);
router.post('/:id/comments', requireAuth, ctrl.addComment);

module.exports = router;
