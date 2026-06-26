const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.get('/search', requireAuth, ctrl.search);
router.get('/:id', requireAuth, ctrl.getProfile);
router.put('/:id', requireAuth, ctrl.updateProfile);
router.post('/:id/follow', requireAuth, ctrl.follow);
router.delete('/:id/follow', requireAuth, ctrl.unfollow);

module.exports = router;
